import { Schema, model } from "mongoose";

const recipeCollectionSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    // Public collections get a shareable page; private ones are owner-only.
    isPublic: { type: Boolean, default: false },
    // Recipes in this collection, in display order. A recipe can live in many
    // collections, so membership is kept here rather than on the recipe.
    recipeIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

recipeCollectionSchema.index({ userId: 1, createdAt: -1 });

export const RecipeCollection = model("RecipeCollection", recipeCollectionSchema);
