import { useEffect, useState } from "react";
import { social, type PlaceCard } from "../../lib/social";
import { useI18n } from "../../lib/i18n";
import { Portal } from "../ui/Portal";
import { CloseIcon, SearchIcon, StarIcon } from "../icons";

const VIS = ["public", "followers", "private"] as const;

export function CheckinSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceCard[]>([]);
  const [selected, setSelected] = useState<{ id?: string; name: string; city?: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [dish, setDish] = useState("");
  const [review, setReview] = useState("");
  const [visibility, setVisibility] = useState<(typeof VIS)[number]>("public");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selected || !query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setResults(await social.searchPlaces(query));
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selected]);

  async function submit() {
    if (!selected) return;
    setSaving(true);
    try {
      await social.createCheckin({
        placeId: selected.id,
        place: selected.id ? undefined : { name: selected.name, city: selected.city },
        rating: rating || undefined,
        dish,
        review,
        visibility,
      });
      onDone();
    } catch {
      setSaving(false);
    }
  }

  const visLabel = (v: (typeof VIS)[number]) =>
    v === "public" ? t.social.visPublic : v === "followers" ? t.social.visFollowers : t.social.visPrivate;

  return (
    <Portal>
      <div className="fixed inset-0 z-40 flex items-end bg-black/50 sm:items-center" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full space-y-3 rounded-t-3xl bg-surface p-4 pb-safe sm:mx-auto sm:max-w-md sm:rounded-2xl sm:pb-4"
        >
          <div className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-line sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.social.checkinTitle}</h2>
            <button onClick={onClose} aria-label={t.common.close} className="text-muted">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {!selected ? (
            <>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.social.searchPlace}
                  className="w-full rounded-xl bg-surface-2 py-2 pl-9 pr-3 text-base"
                />
              </div>
              <div className="space-y-1">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected({ id: r.id, name: r.name, city: r.city })}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {r.name}
                      {r.city ? ` · ${r.city}` : ""}
                    </span>
                    {r.rating != null && (
                      <span className="flex shrink-0 items-center gap-0.5 text-xs text-mustard-600">
                        <StarIcon className="h-3 w-3" />
                        {r.rating}
                      </span>
                    )}
                  </button>
                ))}
                {query.trim() &&
                  !results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => setSelected({ name: query.trim() })}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-primary-600 hover:bg-surface-2"
                    >
                      {t.social.newPlace(query.trim())}
                    </button>
                  )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  📍 {selected.name}
                  {selected.city ? ` · ${selected.city}` : ""}
                </span>
                <button type="button" onClick={() => setSelected(null)} className="shrink-0 text-muted">
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-1 text-xs text-muted">{t.social.rating}</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}`}>
                    <StarIcon className={`h-6 w-6 ${n <= rating ? "text-mustard-500" : "text-line"}`} />
                  </button>
                ))}
              </div>
              <input
                value={dish}
                onChange={(e) => setDish(e.target.value)}
                placeholder={t.social.dish}
                className="w-full rounded-xl bg-surface-2 px-3 py-2 text-base"
              />
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={t.social.reviewPlaceholder}
                rows={3}
                className="w-full rounded-xl bg-surface-2 px-3 py-2 text-base"
              />
              <div className="flex gap-2">
                {VIS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                      visibility === v ? "bg-primary-600 text-white" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {visLabel(v)}
                  </button>
                ))}
              </div>
              <button
                onClick={submit}
                disabled={saving}
                className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {t.social.publish}
              </button>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
