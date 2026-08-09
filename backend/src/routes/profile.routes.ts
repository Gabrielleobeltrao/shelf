import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Profile } from "../models/Profile.js";
import { getOrCreateProfile, serializeProfile } from "../lib/profiles.js";

const router = Router();
router.use(requireAuth);

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
