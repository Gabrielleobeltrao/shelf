import { api } from "./api";
import type { Dict } from "./i18n";

export type HouseholdMember = {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "member";
  isYou: boolean;
};

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
  isHome: boolean;
  role: "owner" | "member";
  members: HouseholdMember[];
};

export type ActivityEntry = {
  id: string;
  userName: string;
  action: string;
  detail: string | null;
  at: string;
};

// Turns an activity entry into a localized sentence (shared by the settings
// history and the dashboard feed).
export function describeActivity(t: Dict, e: ActivityEntry): string {
  const who = e.userName;
  const what = e.detail ?? "";
  switch (e.action) {
    case "item_added":
      return t.household.actItemAdded(who, what);
    case "item_removed":
      return t.household.actItemRemoved(who, what);
    case "list_added":
      return t.household.actListAdded(who, what);
    case "member_joined":
      return t.household.actMemberJoined(who);
    case "member_left":
      return t.household.actMemberLeft(who);
    case "member_removed":
      return t.household.actMemberRemoved(who, what);
    default:
      return who;
  }
}

export const householdApi = {
  get: () => api.get<Household>("/api/household"),
  activity: () => api.get<ActivityEntry[]>("/api/household/activity"),
  rename: (name: string) => api.patch<Household>("/api/household", { name }),
  rotateCode: () => api.post<Household>("/api/household/rotate-code", {}),
  join: (code: string) => api.post<Household>("/api/household/join", { code }),
  leave: () => api.post<Household>("/api/household/leave", {}),
  removeMember: (userId: string) => api.delete<void>(`/api/household/members/${userId}`),
};
