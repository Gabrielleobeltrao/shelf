import { Schema, model } from "mongoose";

const recipeRatingSchema = new Schema(
  {
    recipeId: { type: String, required: true },
    userId: { type: String, required: true },
    stars: { type: Number, required: true, min: 1, max: 6 },
  },
  { timestamps: true },
);

// One rating per user per recipe — re-rating updates the existing one.
recipeRatingSchema.index({ recipeId: 1, userId: 1 }, { unique: true });

export const RecipeRating = model("RecipeRating", recipeRatingSchema);
