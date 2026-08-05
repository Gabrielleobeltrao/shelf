import { Schema, model } from "mongoose";

const settingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    // The user's own pantry (created lazily) and the one they're currently
    // viewing. Managed by the household routes, not the settings API.
    homeHouseholdId: { type: String },
    activeHouseholdId: { type: String },
    trackExpiration: { type: Boolean, default: false },
    expiryAlertDays: { type: Number, default: 7 },
    trackNutrition: { type: Boolean, default: false },
    nutritionFields: { type: [String], default: [] },
    trackGlutenFree: { type: Boolean, default: false },
    trackVegan: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Settings = model("Settings", settingsSchema);
