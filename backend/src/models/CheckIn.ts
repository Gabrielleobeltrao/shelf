import { Schema, model } from "mongoose";

// "Where I'm eating" — a check-in at a place, optionally a review (rating,
// text, dish, photos). Each check-in also spawns a feed Post (postId link).
const checkInSchema = new Schema(
  {
    userId: { type: String, required: true },
    placeId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 6 },
    priceLevel: { type: Number, min: 1, max: 4 },
    tags: { type: [String], default: [] },
    review: { type: String, default: "" },
    dish: { type: String, default: "" },
    photos: { type: [String], default: [] },
    visibility: { type: String, enum: ["public", "followers", "private"], default: "public" },
    postId: { type: String },
  },
  { timestamps: true },
);

checkInSchema.index({ placeId: 1, createdAt: -1 });
checkInSchema.index({ userId: 1, createdAt: -1 });

export const CheckIn = model("CheckIn", checkInSchema);
