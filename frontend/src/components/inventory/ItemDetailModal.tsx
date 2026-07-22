import { useState } from "react";
import { NUTRITION_OPTIONS } from "../../lib/nutrition";
import { CloseIcon, TrashIcon } from "../icons";

export type ItemFormData = {
  name: string;
  brand: string;
  category: string;
  packageSize: string;
  quantity: string;
  unit: string;
  barcode: string;
  imageUrl: string;
  expirationDate: string;
  nutrition: Record<string, string>;
  glutenFree: boolean;
  vegan: boolean;
};

export type VisibleFields = {
  expirationDate: boolean;
  nutritionFields: string[];
  glutenFree: boolean;
  vegan: boolean;
};

type Props = {
  title: string;
  initial: Partial<ItemFormData>;
  visibleFields: VisibleFields;
  onClose: () => void;
  onSave: (data: ItemFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const CATEGORY_SUGGESTIONS = [
  "Laticínios",
  "Grãos e Cereais",
  "Bebidas",
  "Temperos e Condimentos",
  "Limpeza",
  "Higiene",
  "Congelados",
  "Enlatados e Conservas",
  "Hortifruti",
  "Padaria",
  "Carnes",
  "Doces e Sobremesas",
  "Outros",
];

export function ItemDetailModal({
  title,
  initial,
  visibleFields,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [packageSize, setPackageSize] = useState(initial.packageSize ?? "");
  const [quantity, setQuantity] = useState(initial.quantity ?? "1");
  const [unit, setUnit] = useState(initial.unit ?? "un");
  const [barcode, setBarcode] = useState(initial.barcode ?? "");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [expirationDate, setExpirationDate] = useState(initial.expirationDate ?? "");
  const [nutrition, setNutrition] = useState<Record<string, string>>(initial.nutrition ?? {});
  const [glutenFree, setGlutenFree] = useState(initial.glutenFree ?? false);
  const [vegan, setVegan] = useState(initial.vegan ?? false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await onSave({
      name,
      brand,
      category,
      packageSize,
      quantity,
      unit,
      barcode,
      imageUrl,
      expirationDate,
      nutrition,
      glutenFree,
      vegan,
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
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-stone-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-stone-500 dark:text-stone-400">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-32 w-32 rounded-lg object-cover" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400 dark:bg-stone-800">
            Sem foto
          </div>
        )}

        <input
          type="text"
          placeholder="URL da imagem"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />

        <input
          type="text"
          placeholder="Nome do item*"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />

        <input
          type="text"
          placeholder="Marca"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />

        <input
          type="text"
          list="category-suggestions"
          placeholder="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />
        <datalist id="category-suggestions">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <input
          type="text"
          placeholder="Tamanho da embalagem (ex: 500g, 1L)"
          value={packageSize}
          onChange={(e) => setPackageSize(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />

        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Qtd."
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-1/2 rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
          />
          <input
            type="text"
            placeholder="Unidade"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-1/2 rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
          />
        </div>

        <input
          type="text"
          placeholder="Código de barras"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
        />

        {visibleFields.expirationDate && (
          <div>
            <label className="mb-1 block text-sm text-stone-500">Validade</label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
            />
          </div>
        )}

        {visibleFields.nutritionFields.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-stone-500">Informações nutricionais</p>
            <div className="grid grid-cols-2 gap-2">
              {NUTRITION_OPTIONS.filter((option) =>
                visibleFields.nutritionFields.includes(option.key),
              ).map((option) => (
                <input
                  key={option.key}
                  type="number"
                  min={0}
                  step="any"
                  placeholder={`${option.label} (${option.unit})`}
                  value={nutrition[option.key] ?? ""}
                  onChange={(e) =>
                    setNutrition((prev) => ({ ...prev, [option.key]: e.target.value }))
                  }
                  className="rounded-lg border border-stone-300 px-3 py-2 text-base dark:border-stone-700 dark:bg-stone-900"
                />
              ))}
            </div>
          </div>
        )}

        {(visibleFields.glutenFree || visibleFields.vegan) && (
          <div className="flex gap-4">
            {visibleFields.glutenFree && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={glutenFree}
                  onChange={(e) => setGlutenFree(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 dark:border-stone-700"
                />
                Sem glúten
              </label>
            )}
            {visibleFields.vegan && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={vegan}
                  onChange={(e) => setVegan(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 dark:border-stone-700"
                />
                Vegano
              </label>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
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
    </div>
  );
}
