import { Schema, model } from "mongoose";

const recipeCommentSchema = new Schema(
  {
    recipeId: { type: String, required: true },
    userId: { type: String, required: true },
    // Snapshot of the author's display name at comment time, so the comment
    // still shows an author even if the user is deleted later.
    authorName: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

recipeCommentSchema.index({ recipeId: 1, createdAt: -1 });

export const RecipeComment = model("RecipeComment", recipeCommentSchema);
