import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Post } from "../models/Post.js";
import { PostLike } from "../models/PostLike.js";
import { PostComment } from "../models/PostComment.js";
import { Profile } from "../models/Profile.js";
import { Follow } from "../models/Follow.js";
import { canViewPost, serializePosts } from "../lib/posts.js";
import { getOrCreateProfile, usersByIds } from "../lib/profiles.js";
import { notify } from "../lib/notify.js";

const router = Router();
router.use(requireAuth);

const TYPES = ["text", "cooked", "recipe", "checkin", "pantry", "review"];
const VIS = ["public", "followers", "private"];

// Create a post.
router.post("/", async (req, res) => {
  const me = req.userId!;
  const { type, visibility, text, photos, refs } = req.body ?? {};
  if ((!text || !String(text).trim()) && (!Array.isArray(photos) || photos.length === 0) && !refs?.recipeId && !refs?.placeId) {
    res.status(400).json({ error: "Publicação vazia" });
    return;
  }
  await getOrCreateProfile(me);
  const post = await Post.create({
    authorId: me,
    type: TYPES.includes(type) ? type : "text",
    visibility: VIS.includes(visibility) ? visibility : "public",
    text: String(text ?? "").slice(0, 2000),
    photos: Array.isArray(photos) ? photos.slice(0, 6).map((p) => String(p)) : [],
    refs: refs ?? {},
  });
  await Profile.updateOne({ userId: me }, { $inc: { postsCount: 1 } });
  const [serialized] = await serializePosts([post], me);
  res.status(201).json(serialized);
});

// A single post.
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || !(await canViewPost(post, req.userId))) {
    res.status(404).json({ error: "Publicação não encontrada" });
    return;
  }
  const [serialized] = await serializePosts([post], req.userId);
  res.json(serialized);
});

// Delete own post (+ its likes/comments).
router.delete("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.json({ ok: true });
    return;
  }
  if (post.authorId !== req.userId) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  await Promise.all([
    Post.deleteOne({ _id: post._id }),
    PostLike.deleteMany({ postId: String(post._id) }),
    PostComment.deleteMany({ postId: String(post._id) }),
    Profile.updateOne({ userId: req.userId }, { $inc: { postsCount: -1 } }),
  ]);
  res.json({ ok: true });
});

// Like / unlike.
router.post("/:id/like", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || !(await canViewPost(post, req.userId))) {
    res.status(404).json({ error: "Publicação não encontrada" });
    return;
  }
  try {
    await PostLike.create({ postId: String(post._id), userId: req.userId });
    await Post.updateOne({ _id: post._id }, { $inc: { likesCount: 1 } });
    await notify(post.authorId, "like", req.userId!, String(post._id));
  } catch {
    // already liked — idempotent
  }
  const fresh = await Post.findById(post._id);
  res.json({ likes: fresh?.likesCount ?? 0, likedByMe: true });
});

router.delete("/:id/like", async (req, res) => {
  const removed = await PostLike.findOneAndDelete({ postId: req.params.id, userId: req.userId });
  if (removed) await Post.updateOne({ _id: req.params.id }, { $inc: { likesCount: -1 } });
  const fresh = await Post.findById(req.params.id);
  res.json({ likes: fresh?.likesCount ?? 0, likedByMe: false });
});

// Comments.
router.get("/:id/comments", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || !(await canViewPost(post, req.userId))) {
    res.status(404).json({ error: "Publicação não encontrada" });
    return;
  }
  const comments = await PostComment.find({ postId: String(post._id) }).sort({ createdAt: 1 }).limit(200);
  res.json(
    comments.map((c) => ({
      id: String(c._id),
      userId: c.userId,
      authorName: c.authorName,
      text: c.text,
      isMine: c.userId === req.userId,
      createdAt: c.get("createdAt"),
    })),
  );
});

router.post("/:id/comments", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || !(await canViewPost(post, req.userId))) {
    res.status(404).json({ error: "Publicação não encontrada" });
    return;
  }
  const text = String(req.body?.text ?? "").trim().slice(0, 1000);
  if (!text) {
    res.status(400).json({ error: "Comentário vazio" });
    return;
  }
  const user = (await usersByIds([req.userId!])).get(req.userId!);
  const comment = await PostComment.create({
    postId: String(post._id),
    userId: req.userId,
    authorName: user?.name || "Alguém",
    text,
  });
  await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });
  await notify(post.authorId, "comment", req.userId!, String(post._id));
  res.status(201).json({
    id: String(comment._id),
    userId: comment.userId,
    authorName: comment.authorName,
    text: comment.text,
    isMine: true,
    createdAt: comment.get("createdAt"),
  });
});

router.delete("/:id/comments/:commentId", async (req, res) => {
  const comment = await PostComment.findById(req.params.commentId);
  if (!comment) {
    res.json({ ok: true });
    return;
  }
  if (comment.userId !== req.userId) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  await PostComment.deleteOne({ _id: comment._id });
  await Post.updateOne({ _id: comment.postId }, { $inc: { commentsCount: -1 } });
  res.json({ ok: true });
});

// A user's posts, visibility-aware.
router.get("/user/:handle", async (req, res) => {
  const profile = await Profile.findOne({ handle: req.params.handle.toLowerCase() });
  if (!profile) {
    res.status(404).json({ error: "Perfil não encontrado" });
    return;
  }
  const me = req.userId!;
  const isMe = profile.userId === me;
  const follows = isMe
    ? true
    : !!(await Follow.findOne({ followerId: me, followingId: profile.userId, status: "accepted" }));
  const visibilities: Array<"public" | "followers" | "private"> = isMe
    ? ["public", "followers", "private"]
    : follows
      ? ["public", "followers"]
      : ["public"];
  const posts = await Post.find({ authorId: profile.userId, visibility: { $in: visibilities } })
    .sort({ _id: -1 })
    .limit(30);
  res.json(await serializePosts(posts, me));
});

export default router;
