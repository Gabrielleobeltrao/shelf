import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { hasEnoughStock } from "../lib/units";
import type { RecipeFormData } from "../components/recipes/RecipeDetailModal";
import { RecipeDetailModal } from "../components/recipes/RecipeDetailModal";

type RecipeIngredient = {
  itemId: string;
  name: string;
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
};

type ModalState =
  | { mode: "create"; initial: Partial<RecipeFormData> }
  | { mode: "edit"; recipeId: string; initial: Partial<RecipeFormData> };

function getSteps(recipe: Recipe): string[] {
  if (recipe.steps && recipe.steps.length > 0) return recipe.steps;
  if (recipe.instructions) return recipe.instructions.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

export function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      return recipe.ingredients.some((row) => row.name.toLowerCase().includes(term));
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

  async function handleDelete() {
    if (modal?.mode !== "edit") return;
    await api.delete(`/api/recipes/${modal.recipeId}`);
    setRecipes((prev) => prev.filter((r) => r._id !== modal.recipeId));
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
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white"
      >
        Adicionar receita
      </button>

      {recipes.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou ingrediente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-base dark:border-gray-700 dark:bg-gray-900"
          />
          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Abrir filtros"
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 dark:text-gray-400"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <path
                  d="M3 4.5h14l-5.5 6.5v5l-3 1.5v-6.5L3 4.5z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              {categoryFilter && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-600" />
              )}
            </button>
          )}
        </div>
      )}

      {filtersOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-black/50"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full space-y-3 rounded-t-2xl bg-white p-4 dark:bg-gray-950"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                Fechar
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Todos os tipos</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                className="text-sm font-medium text-emerald-600"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma receita cadastrada ainda.</p>
      ) : filteredRecipes.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma receita encontrada.</p>
      ) : (
        <ul className="space-y-3">
          {filteredRecipes.map((recipe) => {
            const missing = missingIngredients(recipe);
            const missingIds = new Set(missing.map((row) => row.itemId));
            const steps = getSteps(recipe);

            return (
              <li
                key={recipe._id}
                onClick={() =>
                  setModal({
                    mode: "edit",
                    recipeId: recipe._id,
                    initial: {
                      name: recipe.name,
                      steps,
                      prepTime: recipe.prepTime != null ? String(recipe.prepTime) : "",
                      servings: recipe.servings != null ? String(recipe.servings) : "",
                      category: recipe.category ?? "",
                      imageUrl: recipe.imageUrl ?? "",
                      ingredients: recipe.ingredients.map((row) => ({
                        itemId: row.itemId,
                        name: row.name,
                        quantity: String(row.quantity),
                        unit: row.unit,
                      })),
                    },
                  })
                }
                className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
              >
                {recipe.imageUrl && (
                  <img src={recipe.imageUrl} alt="" className="h-40 w-full object-cover" />
                )}

                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-medium">{recipe.name}</h2>
                    {recipe.ingredients.length > 0 &&
                      (missing.length === 0 ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Dá pra fazer
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          Falta {missing.length}
                        </span>
                      ))}
                  </div>

                  {(recipe.category || recipe.prepTime || recipe.servings) && (
                    <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
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
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-500"
                          }
                        >
                          {row.quantity} {row.unit} de {row.name}
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

      {modal && (
        <RecipeDetailModal
          title={modal.mode === "edit" ? "Editar receita" : "Nova receita"}
          initial={modal.initial}
          stockItems={items}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
