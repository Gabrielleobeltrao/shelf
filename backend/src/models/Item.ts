import { Schema, model } from "mongoose";

const itemSchema = new Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true, default: "un" },
    category: { type: String },
    brand: { type: String },
    packageSize: { type: String },
    imageUrl: { type: String },
    barcode: { type: String },
    expirationDate: { type: String },
    nutritionInfo: { type: String },
    glutenFree: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

itemSchema.index({ userId: 1, barcode: 1 });

export const Item = model("Item", itemSchema);
