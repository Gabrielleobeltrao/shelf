import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Notification } from "../models/Notification.js";
import { listUsers } from "../lib/profiles.js";

const router = Router();
router.use(requireAuth);

// Social notifications for the caller, newest first, with the unread count.
router.get("/", async (req, res) => {
  const me = req.userId!;
  const notes = await Notification.find({ userId: me }).sort({ createdAt: -1 }).limit(50);
  const actors = new Map(
    (await listUsers([...new Set(notes.map((n) => n.actorId))])).map((u) => [u.userId, u]),
  );
  const unread = await Notification.countDocuments({ userId: me, read: false });
  res.json({
    unread,
    items: notes.map((n) => ({
      id: String(n._id),
      type: n.type,
      actor: actors.get(n.actorId),
      postId: n.postId,
      read: n.read,
      createdAt: n.get("createdAt"),
    })),
  });
});

router.post("/read", async (req, res) => {
  await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
  res.json({ ok: true });
});

export default router;
