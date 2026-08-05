import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { CheckIcon, CloseIcon, MinusIcon, PlusIcon } from "../icons";
import { EmptyState } from "../ui/EmptyState";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";
import { EmptyShelfIllustration } from "../illustrations";
import { useI18n } from "../../lib/i18n";
import { unitLabel } from "../../lib/labels";

type ShoppingListEntry = {
  _id: string;
  name: string;
  brand?: string;
  unit: string;
  imageUrl?: string;
  sourceItemId?: string;
};

type StockItem = {
  _id: string;
  quantity: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShoppingCartModal({ open, onClose }: Props) {
  const { t } = useI18n();
  const [entries, setEntries] = useState<ShoppingListEntry[]>([]);
  const [stockById, setStockById] = useState<Map<string, StockItem>>(new Map());
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setCheckedIds(new Set());
    Promise.all([
      api.get<ShoppingListEntry[]>("/api/shopping-list"),
      api.get<StockItem[]>("/api/items"),
    ])
      .then(([entriesData, itemsData]) => {
        setEntries(entriesData);
        setStockById(new Map(itemsData.map((item) => [item._id, item])));
        setBuyQuantities(Object.fromEntries(entriesData.map((entry) => [entry._id, 1])));
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  function adjustBuyQuantity(entryId: string, delta: number) {
    setBuyQuantities((prev) => ({
      ...prev,
      [entryId]: Math.max(0, (prev[entryId] ?? 0) + delta),
    }));
  }

  function toggleChecked(entryId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }

  // Struck-through entries get their quantity added to stock and leave the
  // list; whatever wasn't struck stays for the next shopping trip.
  async function handleFinishPurchase() {
    const bought = entries.filter((entry) => checkedIds.has(entry._id));
    if (bought.length === 0) return;

    setFinishing(true);
    try {
      for (const entry of bought) {
        const buyQuantity = buyQuantities[entry._id] ?? 0;
        const stockItem = entry.sourceItemId ? stockById.get(entry.sourceItemId) : undefined;

        if (stockItem && buyQuantity > 0) {
          await api.patch(`/api/items/${stockItem._id}`, {
            quantity: stockItem.quantity + buyQuantity,
          });
        }

        await api.delete(`/api/shopping-list/${entry._id}`);
        setEntries((prev) => prev.filter((e) => e._id !== entry._id));
      }
      setCheckedIds(new Set());
      onClose();
    } finally {
      setFinishing(false);
    }
  }

  const checkedCount = entries.filter((entry) => checkedIds.has(entry._id)).length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <aside className="relative flex h-full w-80 max-w-[85vw] flex-col bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.shoppingList.title}</h2>
          <button onClick={onClose} aria-label={t.common.close} className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted">{t.common.loading}</p>
          ) : entries.length === 0 ? (
            <EmptyState
              illustration={<EmptyShelfIllustration />}
              title={t.shoppingList.emptyTitle}
              description={t.shoppingList.emptyDesc}
            />
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => {
                const checked = checkedIds.has(entry._id);

                return (
                  <li
                    key={entry._id}
                    onClick={() => toggleChecked(entry._id)}
                    className={`cursor-pointer space-y-2 rounded-xl bg-surface-2 p-3 ${
                      checked ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          checked
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-line bg-surface"
                        }`}
                      >
                        {checked && <CheckIcon className="h-3.5 w-3.5" />}
                      </span>
                      <PhotoOrFallback
                        src={entry.imageUrl}
                        imgClassName="h-11 w-11 shrink-0 rounded-lg object-cover"
                        fallback={<div className="h-11 w-11 shrink-0 rounded-lg bg-surface" />}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            checked ? "line-through" : ""
                          }`}
                        >
                          {entry.name}
                        </p>
                        {entry.brand && (
                          <p className="truncate text-xs text-muted">{entry.brand}</p>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 pl-9"
                    >
                      <button
                        onClick={() => adjustBuyQuantity(entry._id, -1)}
                        disabled={checked || (buyQuantities[entry._id] ?? 0) <= 0}
                        aria-label={t.shoppingList.decreaseAria(entry.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <span className="min-w-14 whitespace-nowrap text-center text-sm text-muted">
                        {buyQuantities[entry._id] ?? 0} {unitLabel(t, entry.unit)}
                      </span>
                      <button
                        onClick={() => adjustBuyQuantity(entry._id, 1)}
                        disabled={checked}
                        aria-label={t.shoppingList.increaseAria(entry.name)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {entries.length > 0 && (
          <div className="border-t border-line pt-3">
            <button
              onClick={handleFinishPurchase}
              disabled={checkedCount === 0 || finishing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 font-medium text-white disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4" />
              {finishing
                ? t.shoppingList.updatingStock
                : checkedCount > 0
                  ? t.shoppingList.finishCount(checkedCount)
                  : t.shoppingList.finish}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              {t.shoppingList.hint}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
