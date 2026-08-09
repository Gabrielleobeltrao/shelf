import mongoose from "mongoose";
import { Profile } from "../models/Profile.js";
import { Follow } from "../models/Follow.js";

type AuthUser = { _id: unknown; name?: string; email?: string; image?: string };

// Look up Better Auth users (which live outside Mongoose) by their string ids.
export async function usersByIds(ids: string[]): Promise<Map<string, AuthUser>> {
  const objIds = ids
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as mongoose.Types.ObjectId[];
  if (objIds.length === 0) return new Map();
  const users = (await mongoose.connection
    .collection("user")
    .find({ _id: { $in: objIds } })
    .toArray()) as unknown as AuthUser[];
  return new Map(users.map((u) => [String(u._id), u]));
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20) || "user"
  );
}

// The caller's profile, created lazily with a unique handle from name/email.
export async function getOrCreateProfile(userId: string) {
  const existing = await Profile.findOne({ userId });
  if (existing) return existing;
  const user = (await usersByIds([userId])).get(userId);
  const base = slugify(user?.name || user?.email?.split("@")[0] || "user");
  let handle = base;
  for (let i = 1; await Profile.exists({ handle }); i++) handle = `${base}${i}`;
  return Profile.create({ userId, handle });
}

type ProfileDoc = Awaited<ReturnType<typeof getOrCreateProfile>>;

// Client view of a profile: social fields + auth identity + the viewer's
// relationship to it.
export async function serializeProfile(profile: ProfileDoc, viewerId?: string) {
  const user = (await usersByIds([profile.userId])).get(profile.userId);
  const isMe = viewerId === profile.userId;

  let followState: "none" | "pending" | "accepted" = "none";
  let followsViewer = false;
  if (viewerId && !isMe) {
    const [outgoing, incoming] = await Promise.all([
      Follow.findOne({ followerId: viewerId, followingId: profile.userId }),
      Follow.findOne({ followerId: profile.userId, followingId: viewerId, status: "accepted" }),
    ]);
    followState = (outgoing?.status as typeof followState) ?? "none";
    followsViewer = !!incoming;
  }

  return {
    userId: profile.userId,
    handle: profile.handle,
    name: user?.name || "",
    email: isMe ? user?.email : undefined,
    avatarUrl: profile.avatarUrl || user?.image || "",
    bio: profile.bio,
    isPrivate: profile.isPrivate,
    followers: profile.followersCount,
    following: profile.followingCount,
    posts: profile.postsCount,
    isMe,
    followState,
    followsViewer,
  };
}

// Compact user cards (for follower/following lists, mentions, etc.).
export async function listUsers(userIds: string[]) {
  const [users, profiles] = await Promise.all([
    usersByIds(userIds),
    Profile.find({ userId: { $in: userIds } }),
  ]);
  const profileById = new Map(profiles.map((p) => [p.userId, p]));
  return userIds.map((id) => {
    const p = profileById.get(id);
    const u = users.get(id);
    return {
      userId: id,
      handle: p?.handle ?? "",
      name: u?.name || "",
      avatarUrl: p?.avatarUrl || u?.image || "",
    };
  });
}

// Whether `viewerId` is allowed to see `profile`'s follower-only content.
export async function canViewFollowers(profile: ProfileDoc, viewerId?: string): Promise<boolean> {
  if (!profile.isPrivate) return true;
  if (!viewerId) return false;
  if (viewerId === profile.userId) return true;
  const edge = await Follow.findOne({
    followerId: viewerId,
    followingId: profile.userId,
    status: "accepted",
  });
  return !!edge;
}
