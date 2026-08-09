import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Post } from "../models/Post.js";
import { Follow } from "../models/Follow.js";
import { serializePosts } from "../lib/posts.js";

const router = Router();
router.use(requireAuth);

// The home feed: my posts + posts (public/followers) from people I follow,
// newest first, cursor-paginated by _id (fan-out on read).
router.get("/", async (req, res) => {
  const me = req.userId!;
  const following = (await Follow.find({ followerId: me, status: "accepted" })).map((f) => f.followingId);

  const query: Record<string, unknown> = {
    $or: [
      { authorId: me },
      { authorId: { $in: following }, visibility: { $in: ["public", "followers"] } },
    ],
  };
  const cursor = req.query.cursor as string | undefined;
  if (cursor && Types.ObjectId.isValid(cursor)) query._id = { $lt: new Types.ObjectId(cursor) };

  const posts = await Post.find(query).sort({ _id: -1 }).limit(20);
  const items = await serializePosts(posts, me);
  res.json({
    items,
    nextCursor: posts.length === 20 ? String(posts[posts.length - 1]._id) : null,
  });
});

export default router;
