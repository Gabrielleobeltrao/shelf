import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../lib/api";
import { RECIPE_TAGS } from "../lib/recipeTags";
import { BackIcon, SearchIcon, ShelfLogo, StarIcon } from "../components/icons";
import { BowlIllustration, EmptyShelfIllustration } from "../components/illustrations";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { useI18n } from "../lib/i18n";
import { tagLabel } from "../lib/labels";

type ExploreRecipe = {
  _id: string;
  name: string;
  category?: string;
  prepTime?: number;
  servings?: number;
  imageUrl?: string;
  authorName: string | null;
  rating: { average: number; count: number };
  commentCount: number;
};

export function ExploreRecipes() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [recipes, setRecipes] = useState<ExploreRecipe[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    const delay = search.trim() ? 350 : 0;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams({ page: "1" });
      if (search.trim()) params.set("q", search.trim());
      if (tag) params.set("tag", tag);

      fetch(`${API_URL}/api/public/recipes?${params}`)
        .then((res) => (res.ok ? res.json() : { recipes: [], hasMore: false }))
        .then((data) => {
          setRecipes(data.recipes);
          setHasMore(data.hasMore);
          setPage(1);
        })
        .catch(() => setRecipes([]))
        .finally(() => setLoading(false));
    }, delay);

    return () => clearTimeout(timeout);
  }, [search, tag]);

  async function loadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ page: String(nextPage) });
    if (search.trim()) params.set("q", search.trim());
    if (tag) params.set("tag", tag);
    try {
      const res = await fetch(`${API_URL}/api/public/recipes?${params}`);
      const data = res.ok ? await res.json() : { recipes: [], hasMore: false };
      setRecipes((prev) => [...prev, ...data.recipes]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col">
      <header className="grid grid-cols-3 items-center border-b border-line px-4 py-3">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/receitas"))}
          aria-label={t.common.back}
          className="justify-self-start text-muted"
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center justify-self-center gap-2">
          <ShelfLogo className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Shelf</span>
        </Link>
        <span />
      </header>

      <main className="flex-1 space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t.explore.title}</h1>
          <p className="mt-0.5 text-sm text-muted">{t.explore.subtitle}</p>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={t.explore.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-surface-2 py-2.5 pl-9 pr-3 text-base"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
          <button
            type="button"
            onClick={() => setTag("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              tag === "" ? "bg-primary-600 text-white" : "bg-surface-2 text-muted"
            }`}
          >
            {t.explore.all}
          </button>
          {RECIPE_TAGS.map((tagOption) => (
            <button
              key={tagOption}
              type="button"
              onClick={() => setTag(tagOption)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                tag === tagOption ? "bg-primary-600 text-white" : "bg-surface-2 text-muted"
              }`}
            >
              {tagLabel(t, tagOption)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : recipes.length === 0 ? (
          <EmptyState
            illustration={<EmptyShelfIllustration />}
            title={t.explore.emptyTitle}
            description={t.explore.emptyDesc}
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recipes.map((recipe) => (
                <li key={recipe._id}>
                  <Link
                    to={`/receita/${recipe._id}`}
                    className="block overflow-hidden rounded-lg border border-line"
                  >
                    <PhotoOrFallback
                      src={recipe.imageUrl}
                      imgClassName="h-40 w-full object-cover"
                      fallback={
                        <div className="flex h-28 w-full items-center justify-center bg-mustard-100 dark:bg-mustard-900/30">
                          <BowlIllustration className="h-16 w-auto" />
                        </div>
                      }
                    />
                    <div className="space-y-1.5 p-3">
                      <h2 className="truncate font-medium">{recipe.name}</h2>
                      {recipe.authorName && (
                        <p className="truncate text-xs text-muted">{t.explore.by(recipe.authorName)}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        {recipe.category && (
                          <span className="rounded-full bg-mustard-100 px-2 py-0.5 font-medium text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400">
                            {tagLabel(t, recipe.category)}
                          </span>
                        )}
                        {recipe.rating.count > 0 && (
                          <span className="flex items-center gap-1 text-mustard-500">
                            <StarIcon className="h-3.5 w-3.5" filled />
                            <span className="font-medium tabular-nums">
                              {recipe.rating.average.toFixed(1)}
                            </span>
                            <span className="text-muted">({recipe.rating.count})</span>
                          </span>
                        )}
                        {recipe.prepTime != null && <span>{recipe.prepTime} {t.units.min}</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="mx-auto block rounded-lg bg-surface-2 px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {loadingMore ? t.common.loading : t.common.loadMore}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
