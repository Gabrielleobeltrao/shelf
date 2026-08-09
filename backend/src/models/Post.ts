import { Schema, model } from "mongoose";

// A feed post. `type` drives how the card renders; `refs` links to the domain
// object the post is about (recipe cooked, place checked in, etc.).
const postSchema = new Schema(
  {
    authorId: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "cooked", "recipe", "checkin", "pantry", "review"],
      default: "text",
    },
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
    text: { type: String, default: "" },
    photos: { type: [String], default: [] },
    refs: {
      recipeId: { type: String },
      placeId: { type: String },
      checkinId: { type: String },
      itemIds: { type: [String], default: undefined },
      _id: false,
    },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

postSchema.index({ authorId: 1, _id: -1 });

export const Post = model("Post", postSchema);
