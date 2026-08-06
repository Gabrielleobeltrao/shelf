import { useState } from "react";
import { NUTRITION_OPTIONS } from "../../lib/nutrition";
import { CATEGORY_OPTIONS } from "../../lib/categories";
import { LOCATION_OPTIONS } from "../../lib/locations";
import { CloseIcon, TrashIcon } from "../icons";
import { Switch } from "../ui/Switch";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";
import { useI18n } from "../../lib/i18n";
import { categoryLabel, locationLabel } from "../../lib/labels";

export type ItemFormData = {
  name: string;
  brand: string;
  category: string;
  location: string;
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
  const { t } = useI18n();
  const [name, setName] = useState(initial.name ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await onSave({
      name,
      brand,
      category,
      location,
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
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-surface p-4 pb-safe"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t.common.close} className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-3">
          <PhotoOrFallback
            src={imageUrl}
            imgClassName="h-28 w-28 rounded-lg object-cover"
            fallback={
              <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-surface-2">
                <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8 text-muted">
                  <rect x="4" y="10" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="16" cy="18" r="5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12 10l1.5-3h5L20 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            }
          />
          <input
            type="text"
            placeholder={t.itemForm.photoUrl}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <FieldLabel>{t.itemForm.name}</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>{t.itemForm.brand}</FieldLabel>
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
        </div>

        <div>
          <FieldLabel>{t.itemForm.category}</FieldLabel>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {(category && !CATEGORY_OPTIONS.includes(category)
              ? [category, ...CATEGORY_OPTIONS]
              : CATEGORY_OPTIONS
            ).map((c) => (
              <option key={c} value={c}>
                {categoryLabel(t, c)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>{t.itemForm.location}</FieldLabel>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {LOCATION_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {locationLabel(t, l)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>{t.itemForm.packageSize}</FieldLabel>
          <input
            type="text"
            placeholder={t.itemForm.packageSizeExample}
            value={packageSize}
            onChange={(e) => setPackageSize(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-2">
          <div className="w-1/2">
            <FieldLabel>{t.itemForm.quantity}</FieldLabel>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-1/2">
            <FieldLabel>{t.itemForm.unit}</FieldLabel>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <FieldLabel>{t.itemForm.barcode}</FieldLabel>
          <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputClass} />
        </div>

        {visibleFields.expirationDate && (
          <div>
            <FieldLabel>{t.itemForm.expiration}</FieldLabel>
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
            <FieldLabel>{t.itemForm.nutritionInfo}</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {NUTRITION_OPTIONS.filter((option) =>
                visibleFields.nutritionFields.includes(option.key),
              ).map((option) => (
                <input
                  key={option.key}
                  type="number"
                  min={0}
                  step="any"
                  placeholder={`${t.nutrition[option.key]} (${option.unit})`}
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
              <Switch checked={glutenFree} onChange={setGlutenFree} label={t.itemForm.glutenFree} />
            )}
            {visibleFields.vegan && <Switch checked={vegan} onChange={setVegan} label={t.itemForm.vegan} />}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-rust-600 py-2.5 font-medium text-rust-600 disabled:opacity-60"
            >
              <TrashIcon className="h-4 w-4" />
              {deleting ? t.common.deleting : t.common.delete}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-primary-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>

      {confirmingDelete && (
        <ConfirmDialog
          title={t.itemView.confirmDeleteTitle(name)}
          description={t.itemView.confirmDeleteDesc}
          confirmLabel={t.common.delete}
          cancelLabel={t.common.cancel}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
