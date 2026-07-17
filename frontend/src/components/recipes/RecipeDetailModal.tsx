import { useState } from "react";

export type IngredientRow = {
  itemId: string;
  quantity: string;
  unit: string;
};

const UNIT_SUGGESTIONS = [
  "un",
  "g",
  "kg",
  "ml",
  "L",
  "xícara",
  "colher de sopa",
  "colher de chá",
  "pitada",
  "dente",
  "fatia",
];

export type RecipeFormData = {
  name: string;
  instructions: string;
  ingredients: IngredientRow[];
};

type StockItem = {
  _id: string;
  name: string;
  unit: string;
};

type Props = {
  title: string;
  initial: Partial<RecipeFormData>;
  stockItems: StockItem[];
  onClose: () => void;
  onSave: (data: RecipeFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function RecipeDetailModal({
  title,
  initial,
  stockItems,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [instructions, setInstructions] = useState(initial.instructions ?? "");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(initial.ingredients ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function addIngredient() {
    setIngredients((prev) => [
      ...prev,
      { itemId: stockItems[0]?._id ?? "", quantity: "1", unit: stockItems[0]?.unit ?? "un" },
    ]);
  }

  function updateIngredient(index: number, patch: Partial<IngredientRow>) {
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await onSave({
      name,
      instructions,
      ingredients: ingredients.filter((row) => row.itemId),
    });
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-gray-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Fechar
          </button>
        </div>

        <input
          type="text"
          placeholder="Nome da receita*"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Ingredientes</p>

          {stockItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              Cadastre itens no estoque primeiro pra poder escolher ingredientes.
            </p>
          ) : (
            <>
              {ingredients.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={row.itemId}
                    onChange={(e) => {
                      const item = stockItems.find((i) => i._id === e.target.value);
                      updateIngredient(index, {
                        itemId: e.target.value,
                        unit: item?.unit ?? row.unit,
                      });
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
                  >
                    {stockItems.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Qtd."
                    value={row.quantity}
                    onChange={(e) => updateIngredient(index, { quantity: e.target.value })}
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
                  />
                  <select
                    value={row.unit}
                    onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                    className="w-24 shrink-0 rounded-lg border border-gray-300 px-2 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
                  >
                    {[...new Set([row.unit, ...UNIT_SUGGESTIONS])].filter(Boolean).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    aria-label="Remover ingrediente"
                    className="w-9 shrink-0 text-lg text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addIngredient}
                className="text-sm font-medium text-emerald-600"
              >
                + Adicionar ingrediente
              </button>
            </>
          )}
        </div>

        <textarea
          placeholder="Modo de preparo"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <div className="flex gap-2 pt-2">
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-lg border border-red-600 py-2.5 font-medium text-red-600 disabled:opacity-60"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
