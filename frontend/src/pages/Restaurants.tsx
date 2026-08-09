import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { social, type PlaceCard } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { SearchIcon, StarIcon } from "../components/icons";

export function Restaurants() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      social
        .places(query.trim() || undefined)
        .then(setPlaces)
        .catch(() => setPlaces([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-4 pb-16">
      <h1 className="font-display text-xl font-bold">{t.social.restaurants}</h1>
      <div className="relative mx-auto max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.social.searchRestaurants}
          className="w-full rounded-xl bg-surface-2 py-2 pl-9 pr-3 text-base"
        />
      </div>
      <div className="mx-auto max-w-xl space-y-2">
        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : places.length === 0 ? (
          <p className="text-sm text-muted">{t.social.noRestaurants}</p>
        ) : (
          places.map((p) => (
            <Link key={p.id} to={`/lugar/${p.id}`} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                {p.city && <span className="block truncate text-xs text-muted">{p.city}</span>}
              </span>
              {p.rating != null && (
                <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-mustard-600 dark:text-mustard-400">
                  <StarIcon className="h-4 w-4" />
                  {p.rating}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
