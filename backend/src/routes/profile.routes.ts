import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Profile } from "../models/Profile.js";
import { Settings } from "../models/Settings.js";
import { Item } from "../models/Item.js";
import { Follow } from "../models/Follow.js";
import { getOrCreateProfile, serializeProfile, listUsers } from "../lib/profiles.js";

const router = Router();
router.use(requireAuth);

// Discover people: search by @handle/name (?q=…), or suggestions (recent
// profiles you don't follow) when empty. Each card carries the viewer's
// follow state so the UI can show Follow / Following / Requested.
router.get("/", async (req, res) => {
  const me = req.userId!;
  const q = String(req.query.q ?? "").trim();
  let profiles: InstanceType<typeof Profile>[];
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await mongoose.connection.collection("user").find({ name: rx }).limit(20).toArray();
    const nameIds = users.map((u) => String(u._id));
    profiles = await Profile.find({
      $and: [{ $or: [{ handle: rx }, { userId: { $in: nameIds } }] }, { userId: { $ne: me } }],
    }).limit(20);
  } else {
    const following = (await Follow.find({ followerId: me })).map((f) => f.followingId);
    profiles = await Profile.find({ userId: { $nin: [me, ...following] } })
      .sort({ createdAt: -1 })
      .limit(20);
  }
  const ids = profiles.map((p) => p.userId);
  const [cards, edges] = await Promise.all([
    listUsers(ids),
    Follow.find({ followerId: me, followingId: { $in: ids } }),
  ]);
  const stateById = new Map(edges.map((e) => [e.followingId, e.status]));
  res.json(cards.map((c) => ({ ...c, followState: stateById.get(c.userId) ?? "none" })));
});

// The caller's own profile (created lazily on first read).
router.get("/me", async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);
  res.json(await serializeProfile(profile, req.userId));
});

router.patch("/", async (req, res) => {
  const profile = await getOrCreateProfile(req.userId!);
  const { handle, bio, avatarUrl, isPrivate } = req.body ?? {};

  if (handle !== undefined) {
    const clean = String(handle).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    if (clean.length < 2) {
      res.status(400).json({ error: "Handle inválido" });
      return;
    }
    const taken = await Profile.findOne({ handle: clean, userId: { $ne: req.userId } });
    if (taken) {
      res.status(409).json({ error: "Handle já em uso" });
      return;
    }
    profile.handle = clean;
  }
  if (bio !== undefined) profile.bio = String(bio).slice(0, 300);
  if (avatarUrl !== undefined) profile.avatarUrl = String(avatarUrl).slice(0, 500);
  if (isPrivate !== undefined) profile.isPrivate = !!isPrivate;

  await profile.save();
  res.json(await serializeProfile(profile, req.userId));
});

// A user's pantry, if their pantryVisibility allows the viewer to see it.
router.get("/:handle/pantry", async (req, res) => {
  const profile = await Profile.findOne({ handle: req.params.handle.toLowerCase() });
  if (!profile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }
  const settings = await Settings.findOne({ userId: profile.userId });
  const visibility = settings?.pantryVisibility ?? "private";
  const me = req.userId;
  const allowed =
    profile.userId === me ||
    visibility === "public" ||
    (visibility === "followers" &&
      !!me &&
      !!(await Follow.findOne({ followerId: me, followingId: profile.userId, status: "accepted" })));
  if (!allowed) {
    res.status(403).json({ error: "Estoque privado" });
    return;
  }
  const items = await Item.find({ userId: profile.userId }).sort({ name: 1 }).limit(500);
  res.json({
    visibility,
    items: items.map((i) => ({
      id: String(i._id),
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      category: i.category,
      imageUrl: i.imageUrl,
    })),
  });
});

// A profile by @handle.
router.get("/:handle", async (req, res) => {
  const profile = await Profile.findOne({ handle: req.params.handle.toLowerCase() });
  if (!profile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }
  res.json(await serializeProfile(profile, req.userId));
});

export default router;
