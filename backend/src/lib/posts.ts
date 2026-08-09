import { Post } from "../models/Post.js";
import { PostLike } from "../models/PostLike.js";
import { SavedPost } from "../models/SavedPost.js";
import { Follow } from "../models/Follow.js";
import { Recipe } from "../models/Recipe.js";
import { Place } from "../models/Place.js";
import { listUsers } from "./profiles.js";

type PostDoc = InstanceType<typeof Post>;

// Extract #hashtags from text (lowercased, unique, capped).
export function extractTags(text: string): string[] {
  const tags = new Set<string>();
  for (const m of String(text ?? "").matchAll(/#([\p{L}0-9_]{1,50})/gu)) {
    tags.add(m[1].toLowerCase());
  }
  return [...tags].slice(0, 10);
}

// Can `viewerId` see this post?
export async function canViewPost(post: PostDoc, viewerId?: string): Promise<boolean> {
  if (post.authorId === viewerId) return true;
  if (post.visibility === "public") return true;
  if (post.visibility === "private") return false;
  if (!viewerId) return false;
  const edge = await Follow.findOne({
    followerId: viewerId,
    followingId: post.authorId,
    status: "accepted",
  });
  return !!edge;
}

// Client view of a batch of posts: author cards, liked-by-me, and a light
// resolution of the linked recipe (name/photo) when present.
export async function serializePosts(posts: PostDoc[], viewerId?: string) {
  if (posts.length === 0) return [];
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const authors = new Map((await listUsers(authorIds)).map((u) => [u.userId, u]));

  const recipeIds = [...new Set(posts.map((p) => p.refs?.recipeId).filter(Boolean) as string[])];
  const recipes = recipeIds.length
    ? await Recipe.find({ _id: { $in: recipeIds } }).select("name imageUrl")
    : [];
  const recipeById = new Map(
    recipes.map((r) => [String(r._id), { name: r.get("name"), imageUrl: r.get("imageUrl") }]),
  );

  const placeIds = [...new Set(posts.map((p) => p.refs?.placeId).filter(Boolean) as string[])];
  const places = placeIds.length
    ? await Place.find({ _id: { $in: placeIds } }).select("name city ratingSum ratingCount")
    : [];
  const placeById = new Map(
    places.map((p) => {
      const count = p.get("ratingCount") as number;
      return [
        String(p._id),
        {
          id: String(p._id),
          name: p.get("name"),
          city: p.get("city"),
          rating: count > 0 ? Math.round(((p.get("ratingSum") as number) / count) * 10) / 10 : null,
        },
      ];
    }),
  );

  const postIds = posts.map((p) => String(p._id));
  const [liked, saved] = viewerId
    ? await Promise.all([
        PostLike.find({ userId: viewerId, postId: { $in: postIds } }).then(
          (ls) => new Set(ls.map((l) => l.postId)),
        ),
        SavedPost.find({ userId: viewerId, postId: { $in: postIds } }).then(
          (ss) => new Set(ss.map((s) => s.postId)),
        ),
      ])
    : [new Set<string>(), new Set<string>()];

  return posts.map((p) => ({
    id: String(p._id),
    author: authors.get(p.authorId) ?? { userId: p.authorId, handle: "", name: "", avatarUrl: "" },
    type: p.type,
    visibility: p.visibility,
    text: p.text,
    photos: p.photos,
    refs: p.refs,
    recipe: p.refs?.recipeId ? recipeById.get(p.refs.recipeId) : undefined,
    place: p.refs?.placeId ? placeById.get(p.refs.placeId) : undefined,
    likes: p.likesCount,
    comments: p.commentsCount,
    likedByMe: liked.has(String(p._id)),
    savedByMe: saved.has(String(p._id)),
    isMine: p.authorId === viewerId,
    createdAt: p.get("createdAt"),
  }));
}
