import { api } from "./api";

export type RecipeSummary = {
  _id: string;
  name: string;
  imageUrl?: string;
  category?: string;
  prepTime?: number;
  servings?: number;
  isPublic?: boolean;
  savedFrom?: string;
};

export type CollectionListItem = {
  _id: string;
  name: string;
  isPublic: boolean;
  recipeIds: string[];
  covers: string[];
};

export type CollectionDetail = {
  _id: string;
  name: string;
  isPublic: boolean;
  recipes: RecipeSummary[];
};

export const collectionsApi = {
  list: () => api.get<CollectionListItem[]>("/api/collections"),
  create: (name: string) => api.post<CollectionListItem>("/api/collections", { name }),
  get: (id: string) => api.get<CollectionDetail>(`/api/collections/${id}`),
  update: (id: string, body: { name?: string; isPublic?: boolean }) =>
    api.patch<{ _id: string; name: string; isPublic: boolean }>(`/api/collections/${id}`, body),
  remove: (id: string) => api.delete(`/api/collections/${id}`),
  addRecipe: (id: string, recipeId: string) =>
    api.post<{ ok: boolean; recipeIds: string[] }>(`/api/collections/${id}/recipes`, { recipeId }),
  removeRecipe: (id: string, recipeId: string) =>
    api.delete<{ ok: boolean; recipeIds: string[] }>(`/api/collections/${id}/recipes/${recipeId}`),
};
