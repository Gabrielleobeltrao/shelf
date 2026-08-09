import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { social, type DiscoverCard } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { UserRow } from "../components/social/UserRow";
import { SearchIcon } from "../components/icons";

export function Discover() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<DiscoverCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      social
        .discover(query.trim() || undefined)
        .then(setPeople)
        .catch(() => setPeople([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">{t.social.discoverTitle}</h1>
        <Link
          to="/restaurantes"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium"
        >
          🍽 {t.social.restaurants}
        </Link>
      </div>
      <div className="relative mx-auto max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.social.searchPeople}
          className="w-full rounded-xl bg-surface-2 py-2 pl-9 pr-3 text-base"
        />
      </div>
      <div className="mx-auto max-w-xl space-y-2">
        {!query && <h2 className="text-sm font-medium text-muted">{t.social.suggestions}</h2>}
        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-muted">{t.social.noPeople}</p>
        ) : (
          people.map((u) => <UserRow key={u.userId} user={u} />)
        )}
      </div>
    </div>
  );
}
