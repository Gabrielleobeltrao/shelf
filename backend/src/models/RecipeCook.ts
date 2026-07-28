import { Schema, model } from "mongoose";

const recipeCookSchema = new Schema(
  {
    recipeId: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

// One "I made this" mark per user per recipe — toggling removes it.
recipeCookSchema.index({ recipeId: 1, userId: 1 }, { unique: true });

export const RecipeCook = model("RecipeCook", recipeCookSchema);
