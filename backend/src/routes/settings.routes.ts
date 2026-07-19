import { Router } from "express";
import { Settings } from "../models/Settings.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

function serialize(settings: InstanceType<typeof Settings> | null) {
  return {
    trackExpiration: settings?.trackExpiration ?? false,
    trackNutrition: settings?.trackNutrition ?? false,
    nutritionFields: settings?.nutritionFields ?? [],
    trackGlutenFree: settings?.trackGlutenFree ?? false,
    trackVegan: settings?.trackVegan ?? false,
  };
}

router.get("/", async (req, res) => {
  const settings = await Settings.findOne({ userId: req.userId });
  res.json(serialize(settings));
});

router.patch("/", async (req, res) => {
  const { trackExpiration, trackNutrition, nutritionFields, trackGlutenFree, trackVegan } =
    req.body;
  const settings = await Settings.findOneAndUpdate(
    { userId: req.userId },
    { $set: { trackExpiration, trackNutrition, nutritionFields, trackGlutenFree, trackVegan } },
    { new: true, upsert: true, omitUndefined: true },
  );
  res.json(serialize(settings));
});

export default router;
