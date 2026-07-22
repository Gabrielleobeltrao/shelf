import { useState } from "react";
import { NUTRITION_OPTIONS } from "../../lib/nutrition";
import { CloseIcon, TrashIcon } from "../icons";
import { Switch } from "../ui/Switch";

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

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">{children}</label>;
}

const inputClass =
  "w-full rounded-lg bg-surface-2 px-3 py-2 text-base";

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
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-surface p-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-3">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-28 w-28 rounded-lg object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-surface-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 text-muted">
                <rect x="4" y="10" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="16" cy="18" r="5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 10l1.5-3h5L20 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <input
            type="text"
            placeholder="URL da foto do produto"
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
          <FieldLabel>Marca</FieldLabel>
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
        </div>

        <div>
          <FieldLabel>Categoria</FieldLabel>
          <input
            type="text"
            list="category-suggestions"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <FieldLabel>Tamanho da embalagem</FieldLabel>
          <input
            type="text"
            placeholder="ex: 500g, 1L"
            value={packageSize}
            onChange={(e) => setPackageSize(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-2">
          <div className="w-1/2">
            <FieldLabel>Quantidade</FieldLabel>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-1/2">
            <FieldLabel>Unidade</FieldLabel>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <FieldLabel>Código de barras</FieldLabel>
          <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputClass} />
        </div>

        {visibleFields.expirationDate && (
          <div>
            <FieldLabel>Validade</FieldLabel>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {visibleFields.nutritionFields.length > 0 && (
          <div>
            <FieldLabel>Informações nutricionais</FieldLabel>
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
                  className="rounded-lg bg-surface-2 px-3 py-2 text-base"
                />
              ))}
            </div>
          </div>
        )}

        {(visibleFields.glutenFree || visibleFields.vegan) && (
          <div className="space-y-3 border-t border-line pt-3">
            {visibleFields.glutenFree && (
              <Switch checked={glutenFree} onChange={setGlutenFree} label="Sem glúten" />
            )}
            {visibleFields.vegan && <Switch checked={vegan} onChange={setVegan} label="Vegano" />}
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
