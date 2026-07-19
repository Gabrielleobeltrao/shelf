import { useState } from "react";

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
  nutritionInfo: string;
  glutenFree: boolean;
  vegan: boolean;
};

export type VisibleFields = {
  expirationDate: boolean;
  nutrition: boolean;
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
  const [nutritionInfo, setNutritionInfo] = useState(initial.nutritionInfo ?? "");
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
      nutritionInfo,
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

        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-32 w-32 rounded-lg object-cover" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
            Sem foto
          </div>
        )}

        <input
          type="text"
          placeholder="URL da imagem"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <input
          type="text"
          placeholder="Nome do item*"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <input
          type="text"
          placeholder="Marca"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <input
          type="text"
          list="category-suggestions"
          placeholder="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Qtd."
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
          />
          <input
            type="text"
            placeholder="Unidade"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <input
          type="text"
          placeholder="Código de barras"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        {visibleFields.expirationDate && (
          <div>
            <label className="mb-1 block text-sm text-gray-500">Validade</label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
        )}

        {visibleFields.nutrition && (
          <div>
            <label className="mb-1 block text-sm text-gray-500">Informações nutricionais</label>
            <textarea
              placeholder="Ex: Açúcar 5g, Sódio 120mg"
              value={nutritionInfo}
              onChange={(e) => setNutritionInfo(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
            />
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
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
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
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
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
