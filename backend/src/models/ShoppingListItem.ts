import { Schema, model } from "mongoose";

const shoppingListItemSchema = new Schema(
  {
    name: { type: String, required: true },
    unit: { type: String, default: "un" },
    brand: { type: String },
    sourceItemId: { type: String },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

export const ShoppingListItem = model("ShoppingListItem", shoppingListItemSchema);
