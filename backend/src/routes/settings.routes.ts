import { Router } from "express";
import { Settings } from "../models/Settings.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const settings = await Settings.findOne({ userId: req.userId });
  res.json({ trackExpiration: settings?.trackExpiration ?? false });
});

router.patch("/", async (req, res) => {
  const { trackExpiration } = req.body;
  const settings = await Settings.findOneAndUpdate(
    { userId: req.userId },
    { $set: { trackExpiration } },
    { new: true, upsert: true, omitUndefined: true },
  );
  res.json({ trackExpiration: settings.trackExpiration });
});

export default router;
