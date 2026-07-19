import { Schema, model } from "mongoose";

const settingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    trackExpiration: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Settings = model("Settings", settingsSchema);
