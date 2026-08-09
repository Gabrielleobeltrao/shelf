import { Schema, model } from "mongoose";

// A place on someone's "want to go" wishlist.
const savedPlaceSchema = new Schema(
  {
    userId: { type: String, required: true },
    placeId: { type: String, required: true },
  },
  { timestamps: true },
);

savedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });

export const SavedPlace = model("SavedPlace", savedPlaceSchema);
