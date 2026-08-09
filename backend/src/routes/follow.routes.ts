import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Follow } from "../models/Follow.js";
import { Profile } from "../models/Profile.js";
import { getOrCreateProfile, listUsers } from "../lib/profiles.js";

const router = Router();
router.use(requireAuth);

// Pending requests to follow ME (private profile). Literal path — before /:userId.
router.get("/requests", async (req, res) => {
  const reqs = await Follow.find({ followingId: req.userId, status: "pending" }).sort({ createdAt: -1 });
  res.json(await listUsers(reqs.map((r) => r.followerId)));
});

router.post("/requests/:userId/accept", async (req, res) => {
  const me = req.userId!;
  const follow = await Follow.findOneAndUpdate(
    { followerId: req.params.userId, followingId: me, status: "pending" },
    { status: "accepted" },
  );
  if (!follow) {
    res.status(404).json({ error: "Solicitação não encontrada" });
    return;
  }
  await Profile.updateOne({ userId: me }, { $inc: { followersCount: 1 } });
  await Profile.updateOne({ userId: req.params.userId }, { $inc: { followingCount: 1 } });
  res.json({ ok: true });
});

router.post("/requests/:userId/reject", async (req, res) => {
  await Follow.findOneAndDelete({ followerId: req.params.userId, followingId: req.userId, status: "pending" });
  res.json({ ok: true });
});

router.get("/:userId/followers", async (req, res) => {
  const follows = await Follow.find({ followingId: req.params.userId, status: "accepted" })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(await listUsers(follows.map((f) => f.followerId)));
});

router.get("/:userId/following", async (req, res) => {
  const follows = await Follow.find({ followerId: req.params.userId, status: "accepted" })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(await listUsers(follows.map((f) => f.followingId)));
});

// Follow (or request, for a private profile) a user by their id.
router.post("/:userId", async (req, res) => {
  const me = req.userId!;
  const target = req.params.userId;
  if (me === target) {
    res.status(400).json({ error: "Não dá pra seguir a si mesmo" });
    return;
  }
  const targetProfile = await Profile.findOne({ userId: target });
  if (!targetProfile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }
  await getOrCreateProfile(me);
  const existing = await Follow.findOne({ followerId: me, followingId: target });
  if (existing) {
    res.json({ status: existing.status });
    return;
  }
  const status = targetProfile.isPrivate ? "pending" : "accepted";
  await Follow.create({ followerId: me, followingId: target, status });
  if (status === "accepted") {
    await Profile.updateOne({ userId: target }, { $inc: { followersCount: 1 } });
    await Profile.updateOne({ userId: me }, { $inc: { followingCount: 1 } });
  }
  res.status(201).json({ status });
});

router.delete("/:userId", async (req, res) => {
  const me = req.userId!;
  const removed = await Follow.findOneAndDelete({ followerId: me, followingId: req.params.userId });
  if (removed && removed.status === "accepted") {
    await Profile.updateOne({ userId: req.params.userId }, { $inc: { followersCount: -1 } });
    await Profile.updateOne({ userId: me }, { $inc: { followingCount: -1 } });
  }
  res.json({ ok: true });
});

export default router;
