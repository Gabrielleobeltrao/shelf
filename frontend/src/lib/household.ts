import { api } from "./api";

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

export const householdApi = {
  get: () => api.get<Household>("/api/household"),
  rename: (name: string) => api.patch<Household>("/api/household", { name }),
  rotateCode: () => api.post<Household>("/api/household/rotate-code", {}),
  join: (code: string) => api.post<Household>("/api/household/join", { code }),
  leave: () => api.post<Household>("/api/household/leave", {}),
  removeMember: (userId: string) => api.delete<void>(`/api/household/members/${userId}`),
};
