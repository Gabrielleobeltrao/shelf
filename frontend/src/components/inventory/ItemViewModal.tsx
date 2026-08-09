import { useState } from "react";
import { NUTRITION_OPTIONS } from "../../lib/nutrition";
import { useI18n } from "../../lib/i18n";
import { categoryLabel, locationLabel, unitLabel } from "../../lib/labels";
import { BackIcon, CartIcon, MinusIcon, PencilIcon, PlusIcon, TrashIcon } from "../icons";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Portal } from "../ui/Portal";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";

type Item = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  location?: string;
  brand?: string;
  packageSize?: string;
  imageUrl?: string;
  barcode?: string;
  expirationDate?: string;
  nutrition?: Record<string, number>;
  glutenFree?: boolean;
  vegan?: boolean;
};

type VisibleFields = {
  expirationDate: boolean;
  nutritionFields: string[];
  glutenFree: boolean;
  vegan: boolean;
};

type Props = {
  item: Item;
  visibleFields: VisibleFields;
  statusBadge: string | null;
  showActions: boolean;
  inShoppingList: boolean;
  pending: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleRestock: () => void;
  onStep: (delta: number) => void;
};

const infoIconBtn = "flex h-9 w-9 items-center justify-center rounded-full bg-on-photo text-ink shadow-sm";

export function ItemViewModal({
  item,
  visibleFields,
  statusBadge,
  showActions,
  inShoppingList,
  pending,
  onClose,
  onEdit,
  onDelete,
  onToggleRestock,
  onStep,
}: Props) {
  const { t, lang } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const nutritionEntries = visibleFields.nutritionFields
    .map((key) => ({ option: NUTRITION_OPTIONS.find((o) => o.key === key), value: item.nutrition?.[key] }))
    .filter((entry) => entry.option && entry.value != null);

  const infoLines = [
    item.category && { label: t.itemView.category, value: categoryLabel(t, item.category) },
    item.location && { label: t.itemView.location, value: locationLabel(t, item.location) },
    item.packageSize && { label: t.itemView.packageSize, value: item.packageSize },
    item.barcode && { label: t.itemView.barcode, value: item.barcode },
    visibleFields.expirationDate &&
      item.expirationDate && {
        label: t.itemView.expiration,
        value: new Date(`${item.expirationDate}T00:00:00`).toLocaleDateString(
          lang === "pt" ? "pt-BR" : "en-US",
        ),
      },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Portal>
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-3xl bg-surface p-4 pb-safe"
      >
        <div className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-line" />
        <div className="relative h-48 w-full overflow-hidden rounded-xl">
          <PhotoOrFallback
            src={item.imageUrl}
            imgClassName="h-full w-full object-cover"
            fallback={<div className="flex h-full w-full items-center justify-center bg-surface" />}
          />

          <div className="absolute inset-0 flex items-start justify-between p-3">
            <button onClick={onClose} aria-label={t.common.close} className={infoIconBtn}>
              <BackIcon className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              {showActions && (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  aria-label={t.common.delete}
                  className={`${infoIconBtn} text-rust-600 dark:text-rust-400`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
              <button onClick={onEdit} aria-label={t.common.edit} className={infoIconBtn}>
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xl font-semibold">{item.name}</p>
            {item.brand && <p className="text-sm text-muted">{item.brand}</p>}
          </div>
          {statusBadge && (
            <span className="shrink-0 rounded-full bg-rust-100 px-2 py-0.5 text-xs font-medium text-rust-700 dark:bg-rust-900/40 dark:text-rust-400">
              {statusBadge}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 py-1">
          <button
            onClick={() => onStep(-1)}
            disabled={pending || item.quantity <= 0}
            aria-label={t.common.remove}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="min-w-20 text-center text-xl font-semibold tabular-nums">
            {item.quantity} {unitLabel(t, item.unit)}
          </span>
          <button
            onClick={() => onStep(1)}
            disabled={pending}
            aria-label={t.common.add}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {((visibleFields.glutenFree && item.glutenFree) || (visibleFields.vegan && item.vegan)) && (
          <div className="flex gap-2">
            {visibleFields.glutenFree && item.glutenFree && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                {t.itemView.glutenFree}
              </span>
            )}
            {visibleFields.vegan && item.vegan && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                {t.itemView.vegan}
              </span>
            )}
          </div>
        )}

        {infoLines.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {infoLines.map((line) => (
              <div key={line.label} className="rounded-xl bg-surface-2 px-3 py-2">
                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted">{line.label}</p>
                <p className="truncate text-sm font-medium">{line.value}</p>
              </div>
            ))}
          </div>
        )}

        {nutritionEntries.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              {t.itemView.nutritionInfo}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {nutritionEntries.map(({ option, value }) => (
                <div key={option!.key} className="rounded-xl bg-surface-2 px-3 py-2">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted">{t.nutrition[option!.key]}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {value} {option!.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showActions && (
          <button
            onClick={onToggleRestock}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium ${
              inShoppingList
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                : "bg-primary-600 text-white"
            }`}
          >
            <CartIcon className="h-4 w-4" />
            {inShoppingList ? t.itemView.inList : t.itemView.addToList}
          </button>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={t.itemView.confirmDeleteTitle(item.name)}
          description={t.itemView.confirmDeleteDesc}
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
    </Portal>
  );
}
