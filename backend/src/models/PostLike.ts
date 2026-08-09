import { Schema, model } from "mongoose";

const postLikeSchema = new Schema(
  {
    postId: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

postLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const PostLike = model("PostLike", postLikeSchema);
