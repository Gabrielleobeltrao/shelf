import { Router } from "express";
import { Settings } from "../models/Settings.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

function serialize(settings: InstanceType<typeof Settings> | null) {
  return {
    trackExpiration: settings?.trackExpiration ?? false,
    trackNutrition: settings?.trackNutrition ?? false,
    trackGlutenFree: settings?.trackGlutenFree ?? false,
    trackVegan: settings?.trackVegan ?? false,
  };
}

router.get("/", async (req, res) => {
  const settings = await Settings.findOne({ userId: req.userId });
  res.json(serialize(settings));
});

router.patch("/", async (req, res) => {
  const { trackExpiration, trackNutrition, trackGlutenFree, trackVegan } = req.body;
  const settings = await Settings.findOneAndUpdate(
    { userId: req.userId },
    { $set: { trackExpiration, trackNutrition, trackGlutenFree, trackVegan } },
    { new: true, upsert: true, omitUndefined: true },
  );
  res.json(serialize(settings));
});

export default router;
