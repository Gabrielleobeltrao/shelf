import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { RecipeFormData } from "../components/recipes/RecipeDetailModal";
import { RecipeDetailModal } from "../components/recipes/RecipeDetailModal";

type RecipeIngredient = {
  itemId: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  _id: string;
  name: string;
  instructions: string;
  ingredients: RecipeIngredient[];
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

  useEffect(() => {
    Promise.all([api.get<Recipe[]>("/api/recipes"), api.get<StockItem[]>("/api/items")])
      .then(([recipesData, itemsData]) => {
        setRecipes(recipesData);
        setItems(itemsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const itemsById = useMemo(() => new Map(items.map((item) => [item._id, item])), [items]);

  async function handleSave(data: RecipeFormData) {
    if (!modal) return;

    const payload = {
      name: data.name.trim(),
      instructions: data.instructions.trim(),
      ingredients: data.ingredients.map((row) => ({
        itemId: row.itemId,
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
        onClick={() => setModal({ mode: "create", initial: { ingredients: [] } })}
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white"
      >
        Adicionar receita
      </button>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma receita cadastrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li
              key={recipe._id}
              onClick={() =>
                setModal({
                  mode: "edit",
                  recipeId: recipe._id,
                  initial: {
                    name: recipe.name,
                    instructions: recipe.instructions,
                    ingredients: recipe.ingredients.map((row) => ({
                      itemId: row.itemId,
                      quantity: String(row.quantity),
                      unit: row.unit,
                    })),
                  },
                })
              }
              className="cursor-pointer rounded-lg border border-gray-200 p-3 dark:border-gray-800"
            >
              <h2 className="font-medium">{recipe.name}</h2>
              {recipe.ingredients.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  {recipe.ingredients
                    .map((row) => {
                      const item = itemsById.get(row.itemId);
                      if (!item) return null;
                      return `${row.quantity} ${row.unit} de ${item.name}`;
                    })
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {recipe.instructions && (
                <p className="mt-2 truncate text-sm">{recipe.instructions}</p>
              )}
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
