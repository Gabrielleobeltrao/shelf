import { api } from "./api";

export type UserCard = { userId: string; handle: string; name: string; avatarUrl: string };
export type DiscoverCard = UserCard & { followState: "none" | "pending" | "accepted" };

export type ProfileView = {
  userId: string;
  handle: string;
  name: string;
  email?: string;
  avatarUrl: string;
  bio: string;
  isPrivate: boolean;
  followers: number;
  following: number;
  posts: number;
  isMe: boolean;
  followState: "none" | "pending" | "accepted";
  followsViewer: boolean;
};

export type PostRefs = { recipeId?: string; placeId?: string; checkinId?: string; itemIds?: string[] };

export type PostView = {
  id: string;
  author: UserCard;
  type: "text" | "cooked" | "recipe" | "checkin" | "pantry" | "review";
  visibility: "public" | "followers" | "private";
  text: string;
  photos: string[];
  refs?: PostRefs;
  recipe?: { name: string; imageUrl?: string };
  place?: { id: string; name: string; city?: string; rating?: number | null };
  likes: number;
  comments: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isMine: boolean;
  createdAt: string;
};

export type CommentView = {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  isMine: boolean;
  createdAt: string;
};

export type PantryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  imageUrl?: string;
};

export type NotificationView = {
  id: string;
  type: "follow" | "accept" | "like" | "comment";
  actor?: UserCard;
  postId?: string;
  read: boolean;
  createdAt: string;
};

export type PlaceCard = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  geo?: { lat: number; lng: number };
  rating?: number | null;
  ratingCount: number;
};

export type ReviewView = {
  id: string;
  user?: UserCard;
  rating?: number;
  review: string;
  dish: string;
  photos: string[];
  createdAt: string;
};

export const social = {
  myProfile: () => api.get<ProfileView>("/api/profile/me"),
  profile: (handle: string) => api.get<ProfileView>(`/api/profile/${encodeURIComponent(handle)}`),
  updateProfile: (data: Partial<Pick<ProfileView, "handle" | "bio" | "avatarUrl" | "isPrivate">>) =>
    api.patch<ProfileView>("/api/profile", data),
  pantry: (handle: string) =>
    api.get<{ visibility: string; items: PantryItem[] }>(`/api/profile/${encodeURIComponent(handle)}/pantry`),

  discover: (q?: string) =>
    api.get<DiscoverCard[]>(`/api/profile${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  follow: (userId: string) => api.post<{ status: string }>(`/api/follow/${userId}`, {}),
  unfollow: (userId: string) => api.delete(`/api/follow/${userId}`),
  followers: (userId: string) => api.get<UserCard[]>(`/api/follow/${userId}/followers`),
  following: (userId: string) => api.get<UserCard[]>(`/api/follow/${userId}/following`),
  requests: () => api.get<UserCard[]>("/api/follow/requests"),
  acceptRequest: (userId: string) => api.post(`/api/follow/requests/${userId}/accept`, {}),
  rejectRequest: (userId: string) => api.post(`/api/follow/requests/${userId}/reject`, {}),

  feed: (cursor?: string) =>
    api.get<{ items: PostView[]; nextCursor: string | null }>(
      `/api/feed${cursor ? `?cursor=${cursor}` : ""}`,
    ),
  userPosts: (handle: string) => api.get<PostView[]>(`/api/posts/user/${encodeURIComponent(handle)}`),
  explore: (cursor?: string) =>
    api.get<{ items: PostView[]; nextCursor: string | null }>(
      `/api/posts/explore${cursor ? `?cursor=${cursor}` : ""}`,
    ),
  tagFeed: (tag: string, cursor?: string) =>
    api.get<{ items: PostView[]; nextCursor: string | null }>(
      `/api/posts/tag/${encodeURIComponent(tag)}${cursor ? `?cursor=${cursor}` : ""}`,
    ),
  createPost: (data: {
    type?: string;
    visibility?: string;
    text?: string;
    photos?: string[];
    refs?: PostRefs;
  }) => api.post<PostView>("/api/posts", data),
  deletePost: (id: string) => api.delete(`/api/posts/${id}`),
  like: (id: string) => api.post<{ likes: number; likedByMe: boolean }>(`/api/posts/${id}/like`, {}),
  unlike: (id: string) => api.delete<{ likes: number; likedByMe: boolean }>(`/api/posts/${id}/like`),
  save: (id: string) => api.post<{ savedByMe: boolean }>(`/api/posts/${id}/save`, {}),
  unsave: (id: string) => api.delete<{ savedByMe: boolean }>(`/api/posts/${id}/save`),
  savedPosts: () => api.get<PostView[]>("/api/posts/saved"),
  comments: (id: string) => api.get<CommentView[]>(`/api/posts/${id}/comments`),
  addComment: (id: string, text: string) => api.post<CommentView>(`/api/posts/${id}/comments`, { text }),
  deleteComment: (id: string, commentId: string) => api.delete(`/api/posts/${id}/comments/${commentId}`),

  notifications: () => api.get<{ unread: number; items: NotificationView[] }>("/api/notifications"),
  markNotificationsRead: () => api.post("/api/notifications/read", {}),

  searchPlaces: (q: string) => api.get<PlaceCard[]>(`/api/places?q=${encodeURIComponent(q)}`),
  places: (q?: string, city?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    const qs = params.toString();
    return api.get<PlaceCard[]>(`/api/places${qs ? `?${qs}` : ""}`);
  },
  place: (id: string) => api.get<PlaceCard>(`/api/places/${id}`),
  placeReviews: (id: string) => api.get<ReviewView[]>(`/api/places/${id}/checkins`),
  createCheckin: (data: {
    placeId?: string;
    place?: { name: string; city?: string };
    rating?: number;
    review?: string;
    dish?: string;
    photos?: string[];
    visibility?: string;
  }) => api.post<{ id: string; placeId: string; postId: string }>("/api/checkins", data),
};
