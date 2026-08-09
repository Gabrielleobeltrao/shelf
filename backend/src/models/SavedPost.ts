import { Schema, model } from "mongoose";

const savedPostSchema = new Schema(
  {
    userId: { type: String, required: true },
    postId: { type: String, required: true },
  },
  { timestamps: true },
);

savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const SavedPost = model("SavedPost", savedPostSchema);
