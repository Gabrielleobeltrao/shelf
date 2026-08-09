import { Schema, model } from "mongoose";

// A social notification for `userId` (the recipient): someone followed you,
// liked/commented your post, or accepted your follow request.
const notificationSchema = new Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, enum: ["follow", "accept", "like", "comment"], required: true },
    actorId: { type: String, required: true },
    postId: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model("Notification", notificationSchema);
