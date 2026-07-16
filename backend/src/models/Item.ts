import { Schema, model } from "mongoose";

const itemSchema = new Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true, default: "un" },
    category: { type: String },
    barcode: { type: String },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

itemSchema.index({ userId: 1, barcode: 1 });

export const Item = model("Item", itemSchema);
