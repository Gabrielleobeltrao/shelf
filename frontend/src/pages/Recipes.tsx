import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { hasEnoughStock } from "../lib/units";
import type { RecipeFormData } from "../components/recipes/RecipeDetailModal";
import { RecipeDetailModal } from "../components/recipes/RecipeDetailModal";
import { RecipeViewModal } from "../components/recipes/RecipeViewModal";
import { SearchIcon } from "../components/icons";
import { EmptyState } from "../components/ui/EmptyState";
import { BowlIllustration, EmptyShelfIllustration } from "../components/illustrations";

type RecipeIngredient = {
  itemId: string;
  // Older recipes (before ingredients snapshotted their name) may not have
  // this — always fall back to a placeholder rather than showing "undefined".
  name?: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  _id: string;
  name: string;
  steps?: string[];
  instructions?: string;
  prepTime?: number;
  servings?: number;
  category?: string;
  ingredients: RecipeIngredient[];
  imageUrl?: string;
};

type StockItem = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  barcode?: string;
};

type ModalState =
  | { mode: "create"; initial: Partial<RecipeFormData> }
  | { mode: "edit"; recipeId: string; initial: Partial<RecipeFormData> };

function getSteps(recipe: Recipe): string[] {
  if (recipe.steps && recipe.steps.length > 0) return recipe.steps;
  if (recipe.instructions) return recipe.instructions.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

function editInitialFor(recipe: Recipe): Partial<RecipeFormData> {
  return {
    name: recipe.name,
    steps: getSteps(recipe),
    prepTime: recipe.prepTime != null ? String(recipe.prepTime) : "",
    servings: recipe.servings != null ? String(recipe.servings) : "",
    category: recipe.category ?? "",
    imageUrl: recipe.imageUrl ?? "",
    ingredients: recipe.ingredients.map((row) => ({
      itemId: row.itemId,
      name: row.name || "Item removido",
      quantity: String(row.quantity),
      unit: row.unit,
    })),
  };
}

export function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [viewingRecipeId, setViewingRecipeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    Promise.all([api.get<Recipe[]>("/api/recipes"), api.get<StockItem[]>("/api/items")])
      .then(([recipesData, itemsData]) => {
        setRecipes(recipesData);
        setItems(itemsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const itemsById = useMemo(() => new Map(items.map((item) => [item._id, item])), [items]);

  const categories = useMemo(() => {
    const set = new Set(recipes.map((r) => r.category?.trim()).filter(Boolean));
    return [...set].sort((a, b) => a!.localeCompare(b!));
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const term = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      if (categoryFilter && (recipe.category?.trim() || "") !== categoryFilter) return false;
      if (!term) return true;
      if (recipe.name.toLowerCase().includes(term)) return true;
      return recipe.ingredients.some((row) => row.name?.toLowerCase().includes(term));
    });
  }, [recipes, search, categoryFilter]);

  function missingIngredients(recipe: Recipe) {
    return recipe.ingredients.filter((row) => {
      const stockItem = itemsById.get(row.itemId);
      if (!stockItem) return true;
      return hasEnoughStock(row.quantity, row.unit, stockItem.quantity, stockItem.unit) === false;
    });
  }

  async function handleSave(data: RecipeFormData) {
    if (!modal) return;

    const payload = {
      name: data.name.trim(),
      steps: data.steps,
      prepTime: data.prepTime.trim() ? Number(data.prepTime) : undefined,
      servings: data.servings.trim() ? Number(data.servings) : undefined,
      category: data.category.trim(),
      imageUrl: data.imageUrl.trim(),
      ingredients: data.ingredients.map((row) => ({
        itemId: row.itemId,
        name: row.name,
        quantity: Number(row.quantity) || 1,
        unit: row.unit.trim() || "un",
      })),
    };

    if (modal.mode === "edit") {
      const updated = await api.patch<Recipe>(`/api/recipes/${modal.recipeId}`, payload);
      setRecipes((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } else {
      const created = await api.post<Recipe>("/api/recipes", payload);
      setRecipes((prev) => [created, ...prev]);
    }

    setModal(null);
  }

  async function handleDeleteRecipe(recipeId: string) {
    await api.delete(`/api/recipes/${recipeId}`);
    setRecipes((prev) => prev.filter((r) => r._id !== recipeId));
  }

  async function handleDelete() {
    if (modal?.mode !== "edit") return;
    await handleDeleteRecipe(modal.recipeId);
    setModal(null);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Receitas</h1>

      <button
        onClick={() =>
          setModal({
            mode: "create",
            initial: { ingredients: [], imageUrl: "", steps: [] },
          })
        }
        className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white"
      >
        Adicionar receita
      </button>

      {recipes.length > 0 && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou ingrediente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-surface-2 py-2 pl-9 pr-3 text-base"
          />
        </div>
      )}

      {categories.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto overflow-y-visible px-1 py-1.5">
          {categories.map((category) => {
            const active = categoryFilter === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(active ? "" : category!)}
                className={`shrink-0 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 ${
                  active ? "ring-2 ring-primary-600" : ""
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : recipes.length === 0 ? (
        <EmptyState
          illustration={<EmptyShelfIllustration />}
          title="Nenhuma receita ainda"
          description="Adicione sua primeira receita pra começar a cozinhar."
        />
      ) : filteredRecipes.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma receita encontrada.</p>
      ) : (
        <ul className="space-y-3">
          {filteredRecipes.map((recipe) => {
            const missing = missingIngredients(recipe);
            const missingIds = new Set(missing.map((row) => row.itemId));
            const steps = getSteps(recipe);

            return (
              <li
                key={recipe._id}
                onClick={() => setViewingRecipeId(recipe._id)}
                className="cursor-pointer overflow-hidden rounded-lg border border-line"
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-mustard-100 dark:bg-mustard-900/30">
                    <BowlIllustration className="h-16 w-auto" />
                  </div>
                )}

                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-medium">{recipe.name}</h2>
                    {recipe.ingredients.length > 0 &&
                      (missing.length === 0 ? (
                        <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                          Dá pra fazer
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-rust-100 px-2 py-0.5 text-xs font-medium text-rust-700 dark:bg-rust-900/40 dark:text-rust-400">
                          Falta {missing.length}
                        </span>
                      ))}
                  </div>

                  {(recipe.category || recipe.prepTime || recipe.servings) && (
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted">
                      {recipe.category && <span>{recipe.category}</span>}
                      {recipe.prepTime != null && <span>{recipe.prepTime} min</span>}
                      {recipe.servings != null && <span>{recipe.servings} porções</span>}
                    </div>
                  )}

                  {recipe.ingredients.length > 0 && (
                    <ul className="space-y-0.5 text-sm">
                      {recipe.ingredients.map((row, index) => (
                        <li
                          key={`${row.itemId}-${index}`}
                          className={
                            missingIds.has(row.itemId)
                              ? "text-rust-600 dark:text-rust-400"
                              : "text-muted"
                          }
                        >
                          {row.quantity} {row.unit} de {row.name || "Item removido"}
                        </li>
                      ))}
                    </ul>
                  )}

                  {steps.length > 0 && (
                    <ol className="list-inside list-decimal space-y-0.5 text-sm">
                      {steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {viewingRecipeId &&
        (() => {
          const viewingRecipe = recipes.find((r) => r._id === viewingRecipeId);
          if (!viewingRecipe) return null;

          const missing = missingIngredients(viewingRecipe);
          const missingIds = new Set(missing.map((row) => row.itemId));

          return (
            <RecipeViewModal
              recipe={viewingRecipe}
              steps={getSteps(viewingRecipe)}
              missingIds={missingIds}
              onClose={() => setViewingRecipeId(null)}
              onEdit={() => {
                setViewingRecipeId(null);
                setModal({
                  mode: "edit",
                  recipeId: viewingRecipe._id,
                  initial: editInitialFor(viewingRecipe),
                });
              }}
              onDelete={() => {
                setViewingRecipeId(null);
                handleDeleteRecipe(viewingRecipe._id);
              }}
            />
          );
        })()}

      {modal && (
        <RecipeDetailModal
          title={modal.mode === "edit" ? "Editar receita" : "Nova receita"}
          initial={modal.initial}
          stockItems={items}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
          onItemCreated={(item) => setItems((prev) => [item, ...prev])}
        />
      )}
    </div>
  );
}
