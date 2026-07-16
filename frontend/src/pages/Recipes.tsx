import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Recipe = {
  _id: string;
  name: string;
  ingredients: string[];
  instructions: string;
};

export function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Recipe[]>("/api/recipes")
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const recipe = await api.post<Recipe>("/api/recipes", {
      name: name.trim(),
      ingredients: ingredients
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
      instructions: instructions.trim(),
    });

    setRecipes((prev) => [recipe, ...prev]);
    setName("");
    setIngredients("");
    setInstructions("");
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/recipes/${id}`);
    setRecipes((prev) => prev.filter((recipe) => recipe._id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Receitas</h1>

      <form onSubmit={handleAdd} className="space-y-2">
        <input
          type="text"
          placeholder="Nome da receita"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          type="text"
          placeholder="Ingredientes (separados por vírgula)"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />
        <textarea
          placeholder="Modo de preparo"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white"
        >
          Adicionar receita
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma receita cadastrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li
              key={recipe._id}
              className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{recipe.name}</h2>
                <button
                  onClick={() => handleDelete(recipe._id)}
                  className="text-sm text-red-600"
                >
                  Remover
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {recipe.ingredients.join(", ")}
              </p>
              {recipe.instructions && (
                <p className="mt-2 text-sm">{recipe.instructions}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
