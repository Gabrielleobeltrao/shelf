import { Schema, model } from "mongoose";

const settingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
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
