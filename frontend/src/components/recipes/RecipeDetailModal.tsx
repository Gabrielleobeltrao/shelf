import { useState } from "react";
import { api } from "../../lib/api";
import { ProductSearchModal } from "../inventory/ProductSearchModal";
import type { ProductSearchResult } from "../../lib/openFoodFacts";
import { CloseIcon, PlusIcon, TrashIcon } from "../icons";
import { BowlIllustration } from "../illustrations";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";
import { Switch } from "../ui/Switch";

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">{children}</label>;
}

const inputClass =
  "w-full rounded-lg bg-surface-2 px-3 py-2 text-base";

export type IngredientRow = {
  itemId: string;
  name: string;
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

const CATEGORY_SUGGESTIONS = [
  "Café da manhã",
  "Almoço",
  "Jantar",
  "Lanche",
  "Sobremesa",
  "Bebida",
  "Outro",
];

export type RecipeFormData = {
  name: string;
  steps: string[];
  prepTime: string;
  servings: string;
  category: string;
  ingredients: IngredientRow[];
  imageUrl: string;
  isPublic: boolean;
};

type StockItem = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  barcode?: string;
};

type Props = {
  title: string;
  initial: Partial<RecipeFormData>;
  stockItems: StockItem[];
  onClose: () => void;
  onSave: (data: RecipeFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onItemCreated?: (item: StockItem) => void;
};

export function RecipeDetailModal({
  title,
  initial,
  stockItems,
  onClose,
  onSave,
  onDelete,
  onItemCreated,
}: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [steps, setSteps] = useState<string[]>(initial.steps ?? []);
  const [prepTime, setPrepTime] = useState(initial.prepTime ?? "");
  const [servings, setServings] = useState(initial.servings ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(initial.ingredients ?? []);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [isPublic, setIsPublic] = useState(initial.isPublic ?? false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);

  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((step, i) => (i === index ? value : step)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  const usedItemIds = new Set(ingredients.map((row) => row.itemId));
  const hasAvailableItem = stockItems.some((item) => !usedItemIds.has(item._id));

  function availableItemsFor(index: number) {
    const row = ingredients[index];
    const usedElsewhere = new Set(
      ingredients.filter((_, i) => i !== index).map((r) => r.itemId),
    );
    const available = stockItems.filter((item) => !usedElsewhere.has(item._id));

    // If this ingredient's original stock item was deleted, keep it visible
    // (via its saved name) instead of silently swapping the selection.
    if (row.itemId && !available.some((item) => item._id === row.itemId)) {
      const label = row.name || "Item removido";
      return [{ _id: row.itemId, name: `${label} (removido do estoque)` }, ...available];
    }

    return available;
  }

  function addIngredient() {
    const nextItem = stockItems.find((item) => !usedItemIds.has(item._id));
    if (!nextItem) return;

    setIngredients((prev) => [
      ...prev,
      { itemId: nextItem._id, name: nextItem.name, quantity: "1", unit: nextItem.unit },
    ]);
  }

  async function handleSelectProduct(product: ProductSearchResult) {
    setProductSearchOpen(false);

    let item =
      product.source === "local" && product.localItemId
        ? stockItems.find((i) => i._id === product.localItemId)
        : stockItems.find((i) => i.barcode && i.barcode === product.barcode);

    if (!item) {
      setCreatingItem(true);
      item = await api.post<StockItem>("/api/items", {
        name: product.name || "Produto sem nome",
        brand: product.brand ?? "",
        category: product.category ?? "",
        packageSize: product.packageSize ?? "",
        imageUrl: product.imageUrl ?? "",
        barcode: product.barcode,
        quantity: 0,
        unit: "un",
      });
      setCreatingItem(false);
      onItemCreated?.(item);
    }

    if (usedItemIds.has(item._id)) return;

    setIngredients((prev) => [
      ...prev,
      { itemId: item._id, name: item.name, quantity: "1", unit: item.unit },
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
      steps: steps.map((step) => step.trim()).filter(Boolean),
      prepTime,
      servings,
      category,
      ingredients: ingredients.filter((row) => row.itemId),
      imageUrl,
      isPublic,
    });
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setConfirmingDelete(false);
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-surface p-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-3">
          <PhotoOrFallback
            src={imageUrl}
            imgClassName="h-28 w-full rounded-lg object-cover"
            fallback={
              <div className="flex h-28 w-full items-center justify-center rounded-lg bg-mustard-100 dark:bg-mustard-900/30">
                <BowlIllustration className="h-16 w-auto" />
              </div>
            }
          />
          <input
            type="text"
            placeholder="URL da foto do prato"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <FieldLabel>Nome*</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>Tipo</FieldLabel>
          <input
            type="text"
            list="recipe-category-suggestions"
            placeholder="ex: Almoço, Sobremesa"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          />
          <datalist id="recipe-category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="flex gap-2">
          <div className="w-1/2">
            <FieldLabel>Tempo (min)</FieldLabel>
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-1/2">
            <FieldLabel>Porções</FieldLabel>
            <input
              type="number"
              min={0}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Ingredientes</p>

          {ingredients.map((row, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={row.itemId}
                onChange={(e) => {
                  const item = stockItems.find((i) => i._id === e.target.value);
                  updateIngredient(index, {
                    itemId: e.target.value,
                    name: item?.name ?? row.name,
                    unit: item?.unit ?? row.unit,
                  });
                }}
                className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-base"
              >
                {availableItemsFor(index).map((item) => (
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
                className="w-16 rounded-lg bg-surface-2 px-2 py-2 text-base"
              />
              <select
                value={row.unit}
                onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                className="w-24 shrink-0 rounded-lg bg-surface-2 px-2 py-2 text-base"
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rust-100 text-rust-600 dark:bg-rust-900/30"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            {hasAvailableItem && (
              <button
                type="button"
                onClick={addIngredient}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary-600 py-2 text-sm font-medium text-primary-700 dark:text-primary-400"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Do estoque
              </button>
            )}
            <button
              type="button"
              onClick={() => setProductSearchOpen(true)}
              disabled={creatingItem}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary-600 py-2 text-sm font-medium text-primary-700 disabled:opacity-60 dark:text-primary-400"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {creatingItem ? "Adicionando..." : "Buscar produto"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Modo de preparo</p>

          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-sm text-muted">{index + 1}.</span>
              <input
                type="text"
                placeholder={`Passo ${index + 1}`}
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-base"
              />
              <button
                type="button"
                onClick={() => removeStep(index)}
                aria-label="Remover passo"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rust-100 text-rust-600 dark:bg-rust-900/30"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addStep}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary-600 py-2 text-sm font-medium text-primary-700 dark:text-primary-400"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar passo
          </button>
        </div>

        <div className="border-t border-line pt-3">
          <Switch
            checked={isPublic}
            onChange={setIsPublic}
            label="Receita pública"
            description="Qualquer pessoa com o link pode ver esta receita."
          />
        </div>

        <div className="flex gap-2 pt-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-rust-600 py-2.5 font-medium text-rust-600 disabled:opacity-60"
            >
              <TrashIcon className="h-4 w-4" />
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-primary-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>

      {productSearchOpen && (
        <ProductSearchModal
          title="Buscar ingrediente"
          onSelect={handleSelectProduct}
          onClose={() => setProductSearchOpen(false)}
          localItems={stockItems}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title={`Excluir "${name}"?`}
          description="A receita será removida permanentemente."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
