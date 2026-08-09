import { Schema, model } from "mongoose";

const postCommentSchema = new Schema(
  {
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    // Snapshot of the author's name so the comment survives account deletion.
    authorName: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

postCommentSchema.index({ postId: 1, createdAt: -1 });

export const PostComment = model("PostComment", postCommentSchema);
