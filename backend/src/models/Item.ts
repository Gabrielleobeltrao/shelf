import { Schema, model } from "mongoose";

const itemSchema = new Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true, default: "un" },
    category: { type: String },
    // Where the item lives — pantry, fridge, freezer, etc. (stored in pt-BR,
    // translated for display like categories).
    location: { type: String },
    brand: { type: String },
    packageSize: { type: String },
    imageUrl: { type: String },
    barcode: { type: String },
    expirationDate: { type: String },
    nutrition: {
      calories: { type: Number },
      carbs: { type: Number },
      sugar: { type: Number },
      protein: { type: Number },
      fat: { type: Number },
      saturatedFat: { type: Number },
      fiber: { type: Number },
      sodium: { type: Number },
      _id: false,
    },
    glutenFree: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

itemSchema.index({ userId: 1, barcode: 1 });

export const Item = model("Item", itemSchema);
