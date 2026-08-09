import { Notification } from "../models/Notification.js";

// Fire-and-forget notification create. No-op when the actor is the recipient.
export async function notify(
  recipientId: string,
  type: "follow" | "accept" | "like" | "comment",
  actorId: string,
  postId?: string,
) {
  if (recipientId === actorId) return;
  try {
    await Notification.create({ userId: recipientId, type, actorId, postId });
  } catch {
    /* notifications are best-effort */
  }
}
