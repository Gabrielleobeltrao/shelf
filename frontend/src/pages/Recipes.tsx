import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
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
  instructions: string;
  ingredients: RecipeIngredient[];
  imageUrl?: string;
};

type StockItem = {
  _id: string;
  name: string;
  unit: string;
};

type ModalState =
  | { mode: "create"; initial: Partial<RecipeFormData> }
  | { mode: "edit"; recipeId: string; initial: Partial<RecipeFormData> };

export function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([api.get<Recipe[]>("/api/recipes"), api.get<StockItem[]>("/api/items")])
      .then(([recipesData, itemsData]) => {
        setRecipes(recipesData);
        setItems(itemsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRecipes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recipes;

    return recipes.filter((recipe) => {
      if (recipe.name.toLowerCase().includes(term)) return true;
      return recipe.ingredients.some((row) => row.name.toLowerCase().includes(term));
    });
  }, [recipes, search]);

  async function handleSave(data: RecipeFormData) {
    if (!modal) return;

    const payload = {
      name: data.name.trim(),
      instructions: data.instructions.trim(),
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
          setModal({ mode: "create", initial: { ingredients: [], imageUrl: "" } })
        }
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white"
      >
        Adicionar receita
      </button>

      {recipes.length > 0 && (
        <input
          type="text"
          placeholder="Buscar por nome ou ingrediente"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma receita cadastrada ainda.</p>
      ) : filteredRecipes.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma receita encontrada.</p>
      ) : (
        <ul className="space-y-3">
          {filteredRecipes.map((recipe) => (
            <li
              key={recipe._id}
              onClick={() =>
                setModal({
                  mode: "edit",
                  recipeId: recipe._id,
                  initial: {
                    name: recipe.name,
                    instructions: recipe.instructions,
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

              <div className="p-3">
                <h2 className="font-medium">{recipe.name}</h2>

                {recipe.ingredients.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-sm text-gray-500">
                    {recipe.ingredients.map((row, index) => (
                      <li key={`${row.itemId}-${index}`}>
                        {row.quantity} {row.unit} de {row.name}
                      </li>
                    ))}
                  </ul>
                )}

                {recipe.instructions && (
                  <p className="mt-2 truncate text-sm">{recipe.instructions}</p>
                )}
              </div>
            </li>
          ))}
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
