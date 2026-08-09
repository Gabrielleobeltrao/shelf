import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useI18n } from "../../lib/i18n";
import { daysUntil, getExpirationWarning } from "../../lib/expiration";
import { CartIcon, CheckIcon, CloseIcon } from "../icons";
import { EmptyState } from "../ui/EmptyState";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";
import { Portal } from "../ui/Portal";
import { EmptyShelfIllustration } from "../illustrations";

export type AlertItem = {
  _id: string;
  name: string;
  brand?: string;
  unit: string;
  imageUrl?: string;
  expirationDate?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: AlertItem[];
  trackExpiration: boolean;
  withinDays: number;
  onDismiss: (item: AlertItem) => void;
  onClearAll: () => void;
  onRemoved: (item: AlertItem) => void;
};

export function NotificationsPanel({
  open,
  onClose,
  items,
  trackExpiration,
  withinDays,
  onDismiss,
  onClearAll,
  onRemoved,
}: Props) {
  const { t } = useI18n();
  // Items already on the shopping list (by sourceItemId) shouldn't offer
  // "restock" again — we mark them as already listed instead.
  const [listedIds, setListedIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  // When restocking, ask whether the product was already thrown out (so we can
  // also remove it from the pantry). `confirming` is the item being restocked.
  const [confirming, setConfirming] = useState<AlertItem | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAddedIds(new Set());
    api
      .get<{ sourceItemId?: string }[]>("/api/shopping-list")
      .then((list) =>
        setListedIds(new Set(list.map((e) => e.sourceItemId).filter(Boolean) as string[])),
      )
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const expired = items.filter((i) => i.expirationDate && daysUntil(i.expirationDate) < 0);
  const soon = items.filter((i) => i.expirationDate && daysUntil(i.expirationDate) >= 0);

  // Add the product to the shopping list; if it was already thrown out, also
  // remove it from the pantry.
  async function restock(item: AlertItem, discard: boolean) {
    setBusy(true);
    setAddedIds((prev) => new Set(prev).add(item._id));
    try {
      await api.post("/api/shopping-list", {
        name: item.name,
        brand: item.brand,
        unit: item.unit,
        imageUrl: item.imageUrl,
        sourceItemId: item._id,
      });
      if (discard) {
        await api.delete(`/api/items/${item._id}`);
        onRemoved(item);
      }
    } catch {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  function row(item: AlertItem) {
    const listed = listedIds.has(item._id) || addedIds.has(item._id);
    return (
      <li key={item._id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
        <PhotoOrFallback
          src={item.imageUrl}
          imgClassName="h-11 w-11 shrink-0 rounded-lg object-cover"
          fallback={<div className="h-11 w-11 shrink-0 rounded-lg bg-surface" />}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <span className="text-xs font-medium text-rust-700 dark:text-rust-400">
            {getExpirationWarning(t, item.expirationDate, withinDays)}
          </span>
        </div>
        {listed ? (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-400">
            <CheckIcon className="h-4 w-4" />
            {t.notifications.inList}
          </span>
        ) : (
          <button
            onClick={() => setConfirming(item)}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white"
          >
            <CartIcon className="h-4 w-4" />
            {t.notifications.addToList}
          </button>
        )}
        <button
          onClick={() => onDismiss(item)}
          aria-label={t.notifications.dismissAria(item.name)}
          className="shrink-0 text-muted"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </li>
    );
  }

  return (
    <>
    <Portal>
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <aside className="relative flex h-full w-80 max-w-[85vw] flex-col bg-surface p-4 pb-safe">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.notifications.title}</h2>
          <div className="flex items-center gap-3">
            {trackExpiration && items.length > 0 && (
              <button onClick={onClearAll} className="text-xs font-medium text-primary-600">
                {t.notifications.clearAll}
              </button>
            )}
            <button onClick={onClose} aria-label={t.common.close} className="text-muted">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {!trackExpiration ? (
            <p className="text-sm text-muted">
              {t.notifications.disabledPrefix}{" "}
              <Link to="/configuracoes" className="text-primary-600 underline">
                {t.notifications.disabledLink}
              </Link>{" "}
              {t.notifications.disabledSuffix}
            </p>
          ) : items.length === 0 ? (
            <EmptyState
              illustration={<EmptyShelfIllustration />}
              title={t.notifications.empty}
              description=""
            />
          ) : (
            <div className="space-y-4">
              {expired.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-rust-600 dark:text-rust-400">
                    {t.notifications.expired}
                  </p>
                  <ul className="space-y-2">{expired.map(row)}</ul>
                </div>
              )}
              {soon.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    {t.notifications.soon}
                  </p>
                  <ul className="space-y-2">{soon.map(row)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
    </Portal>

    {confirming && (
      <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center"
        onClick={() => !busy && setConfirming(null)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full space-y-3 rounded-t-3xl bg-surface p-4 pb-safe sm:mx-auto sm:max-w-sm sm:rounded-2xl sm:pb-4"
        >
          <div className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-line sm:hidden" />
          <p className="font-semibold">{confirming.name}</p>
          <p className="text-sm text-muted">{t.notifications.restockHint}</p>
          <p className="text-sm font-medium">{t.notifications.discardQuestion}</p>
          <div className="space-y-2">
            <button
              disabled={busy}
              onClick={() => restock(confirming, true)}
              className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {t.notifications.discardYes}
            </button>
            <button
              disabled={busy}
              onClick={() => restock(confirming, false)}
              className="w-full rounded-xl bg-surface-2 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {t.notifications.discardNo}
            </button>
          </div>
        </div>
      </div>
      </Portal>
    )}
    </>
  );
}
