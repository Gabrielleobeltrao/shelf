import { Post } from "../models/Post.js";
import { PostLike } from "../models/PostLike.js";
import { Follow } from "../models/Follow.js";
import { Recipe } from "../models/Recipe.js";
import { listUsers } from "./profiles.js";

type PostDoc = InstanceType<typeof Post>;

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

  const postIds = posts.map((p) => String(p._id));
  const liked = viewerId
    ? new Set((await PostLike.find({ userId: viewerId, postId: { $in: postIds } })).map((l) => l.postId))
    : new Set<string>();

  return posts.map((p) => ({
    id: String(p._id),
    author: authors.get(p.authorId) ?? { userId: p.authorId, handle: "", name: "", avatarUrl: "" },
    type: p.type,
    visibility: p.visibility,
    text: p.text,
    photos: p.photos,
    refs: p.refs,
    recipe: p.refs?.recipeId ? recipeById.get(p.refs.recipeId) : undefined,
    likes: p.likesCount,
    comments: p.commentsCount,
    likedByMe: liked.has(String(p._id)),
    isMine: p.authorId === viewerId,
    createdAt: p.get("createdAt"),
  }));
}
