import { Schema, model } from "mongoose";

// A follow edge. status is "accepted" for public profiles and "pending" for a
// request to a private profile (owner approves/rejects).
const followSchema = new Schema(
  {
    followerId: { type: String, required: true },
    followingId: { type: String, required: true },
    status: { type: String, enum: ["accepted", "pending"], default: "accepted" },
  },
  { timestamps: true },
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1, status: 1 });

export const Follow = model("Follow", followSchema);
