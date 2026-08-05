import { Schema, model } from "mongoose";

const shoppingListItemSchema = new Schema(
  {
    name: { type: String, required: true },
    unit: { type: String, default: "un" },
    brand: { type: String },
    imageUrl: { type: String },
    sourceItemId: { type: String },
    // Owning household — the list is shared per household; userId is who added.
    householdId: { type: String },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

export const ShoppingListItem = model("ShoppingListItem", shoppingListItemSchema);
