import { Schema, model } from "mongoose";

// A restaurant / place people check in to. Ratings are aggregated from
// check-ins (sum + count → average).
const placeSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    description: { type: String, default: "" },
    imageUrl: { type: String },
    geo: { lat: Number, lng: Number, _id: false },
    categories: { type: [String], default: [] },
    createdBy: { type: String, required: true },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    // Price level aggregated from check-ins (1–4, "$"–"$$$$").
    priceSum: { type: Number, default: 0 },
    priceCount: { type: Number, default: 0 },
    // Tag key -> vote count, aggregated from check-ins (e.g. { romantic: 3 }).
    tagCounts: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

placeSchema.index({ name: 1 });

export const Place = model("Place", placeSchema);
