import { Schema, model } from "mongoose";

// Social profile for a Better Auth user. Identity (name, email, image) still
// lives in the auth `user` collection; this holds the social layer keyed by
// userId. Counters are denormalized for cheap reads.
const profileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    isPrivate: { type: Boolean, default: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Profile = model("Profile", profileSchema);
