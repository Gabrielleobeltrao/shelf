import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { social, type PlaceCard } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { SearchIcon, StarIcon } from "../components/icons";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";

type Tab = "popular" | "top" | "wishlist";

function PlaceGridCard({ p }: { p: PlaceCard }) {
  return (
    <Link
      to={`/lugar/${p.id}`}
      className="group relative overflow-hidden rounded-lg border border-line bg-surface-2"
    >
      <div className="relative">
        <PhotoOrFallback
          src={p.imageUrl}
          imgClassName="h-36 w-full object-cover"
          fallback={
            <div className="flex h-36 w-full items-center justify-center bg-mustard-100 dark:bg-mustard-900/30">
              <span className="text-4xl">🍽️</span>
            </div>
          }
        />
        {p.rating != null && (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-on-photo px-2 py-0.5 text-xs font-semibold text-ink shadow-sm">
            <StarIcon className="h-3.5 w-3.5 text-mustard-500" />
            {p.rating}
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h2 className="truncate font-display font-bold leading-tight">{p.name}</h2>
        {(p.categories?.[0] || p.city) && (
          <p className="truncate text-xs text-muted">
            {[p.categories?.[0], p.city].filter(Boolean).join(" · ")}
          </p>
        )}
        {p.description && <p className="line-clamp-2 text-xs text-muted">{p.description}</p>}
      </div>
    </Link>
  );
}

export function Restaurants() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("popular");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const req =
        tab === "wishlist"
          ? social.savedPlaces()
          : social.places(query.trim() || undefined, undefined, tab === "top" ? "rating" : undefined);
      req
        .then(setPlaces)
        .catch(() => setPlaces([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "popular", label: t.social.tabPopular },
    { key: "top", label: t.social.tabTopRated },
    { key: "wishlist", label: t.social.tabWantToGo },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-16">
      <h1 className="font-display text-xl font-bold">{t.social.restaurants}</h1>

      <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              tab === tb.key ? "bg-surface text-fg shadow-sm" : "text-muted"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab !== "wishlist" && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.social.searchRestaurants}
            className="w-full rounded-xl bg-surface-2 py-2 pl-9 pr-3 text-base"
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : places.length === 0 ? (
        <p className="text-sm text-muted">
          {tab === "wishlist" ? t.social.emptyWishlist : t.social.noRestaurants}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((p) => (
            <li key={p.id}>
              <PlaceGridCard p={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
