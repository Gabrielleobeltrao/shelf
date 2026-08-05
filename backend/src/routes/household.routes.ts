import { Router } from "express";
import mongoose from "mongoose";
import { Household, uniqueInviteCode } from "../models/Household.js";
import { Settings } from "../models/Settings.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { resolveHousehold } from "../lib/household.js";

const router = Router();

router.use(requireAuth);

type HouseholdDoc = InstanceType<typeof Household>;

// Build the client-facing view of a household, resolving member names/emails
// from the auth user collection so the UI can show who's in the space.
async function serialize(household: HouseholdDoc, userId: string, homeId: string) {
  const ids = household.members
    .map((m) => {
      try {
        return new mongoose.Types.ObjectId(m.userId);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as mongoose.Types.ObjectId[];

  const users = await mongoose.connection
    .collection("user")
    .find({ _id: { $in: ids } })
    .toArray();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  return {
    id: String(household._id),
    name: household.name,
    inviteCode: household.inviteCode,
    isHome: String(household._id) === homeId,
    role: household.members.find((m) => m.userId === userId)?.role ?? "member",
    members: household.members.map((m) => {
      const u = byId.get(m.userId);
      return {
        userId: m.userId,
        name: (u?.name as string) || (u?.email as string) || "?",
        email: (u?.email as string) || "",
        role: m.role,
        isYou: m.userId === userId,
      };
    }),
  };
}

// Current space (members, your role, invite code).
router.get("/", async (req, res) => {
  const { household, homeHouseholdId } = await resolveHousehold(req.userId!);
  res.json(await serialize(household, req.userId!, homeHouseholdId));
});

// Rename — owner only.
router.patch("/", async (req, res) => {
  const { household, homeHouseholdId, role } = await resolveHousehold(req.userId!);
  if (role !== "owner") {
    res.status(403).json({ error: "Só o dono pode renomear" });
    return;
  }
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name) {
    household.name = name;
    await household.save();
  }
  res.json(await serialize(household, req.userId!, homeHouseholdId));
});

// Rotate the invite code — owner only. Old links stop working.
router.post("/rotate-code", async (req, res) => {
  const { household, homeHouseholdId, role } = await resolveHousehold(req.userId!);
  if (role !== "owner") {
    res.status(403).json({ error: "Só o dono pode gerar novo código" });
    return;
  }
  household.inviteCode = await uniqueInviteCode();
  await household.save();
  res.json(await serialize(household, req.userId!, homeHouseholdId));
});

// Join a space by code. Keeps at most one non-home membership: leaving the
// previous shared space first so the user is only ever in home + one other.
router.post("/join", async (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  const target = code ? await Household.findOne({ inviteCode: code }) : null;
  if (!target) {
    res.status(404).json({ error: "Código inválido" });
    return;
  }

  const { household: current, homeHouseholdId } = await resolveHousehold(req.userId!);
  const settings = await Settings.findOne({ userId: req.userId });

  if (String(target._id) === homeHouseholdId) {
    res.status(400).json({ error: "Esse já é o seu espaço" });
    return;
  }

  // Drop the previous shared space (never home) before switching.
  if (String(current._id) !== homeHouseholdId && String(current._id) !== String(target._id)) {
    await Household.updateOne({ _id: current._id }, { $pull: { members: { userId: req.userId } } });
  }

  if (!target.members.some((m) => m.userId === req.userId)) {
    await Household.updateOne(
      { _id: target._id },
      { $push: { members: { userId: req.userId, role: "member" } } },
    );
  }

  if (settings) {
    settings.activeHouseholdId = String(target._id);
    await settings.save();
  }

  const fresh = await Household.findById(target._id);
  res.json(await serialize(fresh!, req.userId!, homeHouseholdId));
});

// Leave the current shared space and return home. Can't leave home.
router.post("/leave", async (req, res) => {
  const { household, homeHouseholdId, isHome } = await resolveHousehold(req.userId!);
  if (isHome) {
    res.status(400).json({ error: "Você não pode sair do seu próprio espaço" });
    return;
  }

  await Household.updateOne({ _id: household._id }, { $pull: { members: { userId: req.userId } } });

  const settings = await Settings.findOne({ userId: req.userId });
  if (settings) {
    settings.activeHouseholdId = homeHouseholdId;
    await settings.save();
  }

  const home = await Household.findById(homeHouseholdId);
  res.json(await serialize(home!, req.userId!, homeHouseholdId));
});

// Remove a member — owner only. Removing yourself isn't allowed here (leave).
router.delete("/members/:userId", async (req, res) => {
  const { household, homeHouseholdId, role } = await resolveHousehold(req.userId!);
  if (role !== "owner") {
    res.status(403).json({ error: "Só o dono pode remover membros" });
    return;
  }
  const target = req.params.userId;
  if (target === req.userId) {
    res.status(400).json({ error: "Use sair para remover a si mesmo" });
    return;
  }
  if (household.members.find((m) => m.userId === target)?.role === "owner") {
    res.status(400).json({ error: "Não é possível remover o dono" });
    return;
  }

  await Household.updateOne({ _id: household._id }, { $pull: { members: { userId: target } } });

  // The removed user's next request falls back to their home space.
  await Settings.updateOne(
    { userId: target, activeHouseholdId: String(household._id) },
    { $set: { activeHouseholdId: null } },
  );

  const fresh = await Household.findById(household._id);
  res.json(await serialize(fresh!, req.userId!, homeHouseholdId));
});

export default router;
