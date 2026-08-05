import { HouseholdActivity } from "../models/HouseholdActivity.js";

export type ActivityAction =
  | "item_added"
  | "item_removed"
  | "list_added"
  | "member_joined"
  | "member_left"
  | "member_removed";

// Records a change in the household's history. Best-effort: a logging failure
// must never break the underlying action, so callers don't await-and-throw.
export function logActivity(
  householdId: string | undefined,
  userId: string | undefined,
  action: ActivityAction,
  detail?: string,
) {
  if (!householdId || !userId) return;
  HouseholdActivity.create({ householdId, userId, action, detail }).catch(() => {});
}
