import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { tagLabel, unitLabel } from "../lib/labels";
import { hasEnoughStock } from "../lib/units";
import { normalizeName } from "../lib/text";
import { BackIcon, BookmarkIcon, CartIcon, ChatIcon, CheckIcon, CookedIcon, MenuIcon, MinusIcon, PencilIcon, PlusIcon, StarIcon } from "../components/icons";
import { BowlIllustration, EmptyShelfIllustration } from "../components/illustrations";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";

type Comment = {
  _id: string;
  authorName: string;
  text: string;
  createdAt: string;
  mine: boolean;
};

type PublicRecipeData = {
  recipe: {
    _id: string;
    name: string;
    category?: string;
    prepTime?: number;
    servings?: number;
    imageUrl?: string;
    ingredients: { name?: string; quantity: number; unit: string }[];
    steps: string[];
    isPublic: boolean;
  };
  authorName: string | null;
  isOwner: boolean;
  isLoggedIn: boolean;
  rating: { average: number; count: number; mine: number | null };
  comments: Comment[];
  saved: boolean;
  cookedCount: number;
  savedCount: number;
  cooked: boolean;
};

const STARS = [1, 2, 3, 4, 5, 6];

function formatCommentDate(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

// Scaled amounts round by the kind of unit:
//  - countable (un/egg): whole numbers — no ⅛ of an egg;
//  - metric weight/volume (g/ml/kg/L): clean decimals;
//  - cooking measures (cup/spoon, and anything else): fractions like 1½.
const COUNT_UNITS = new Set([
  "un", "und", "unid", "unidade", "unidades",
  "dente", "dentes", "pitada", "pitadas",
]);
const METRIC_UNITS = new Set([
  "g", "gr", "grs", "grama", "gramas", "kg", "quilo", "quilos", "mg",
  "ml", "l", "litro", "litros", "cl", "oz", "lb",
]);
const FRACTIONS: [number, string][] = [
  [0, ""],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [1, ""],
];

function formatFraction(n: number): string {
  let whole = Math.floor(n);
  const frac = n - whole;
  let label = "";
  let best = Infinity;
  for (const [value, glyph] of FRACTIONS) {
    const dist = Math.abs(frac - value);
    if (dist < best) {
      best = dist;
      if (value === 1) {
        whole += 1;
        label = "";
      } else {
        label = glyph;
      }
    }
  }
  if (label === "") return whole === 0 ? String(Math.round(n * 100) / 100) : String(whole);
  return whole === 0 ? label : `${whole} ${label}`;
}

function formatQuantity(n: number, unit: string): string {
  if (!isFinite(n) || n <= 0) return "0";
  const u = unit.trim().toLowerCase();
  if (u === "" || COUNT_UNITS.has(u)) return String(Math.max(1, Math.round(n)));
  if (METRIC_UNITS.has(u)) return String(n >= 10 ? Math.round(n) : Math.round(n * 4) / 4);
  return formatFraction(n);
}

// Recipes are shared without their owner's itemIds, so "Cozinhar agora"
// matches ingredients to your pantry by name — accent- and case-insensitive.
type StockItem = { _id: string; name: string; quantity: number; unit: string };

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.status === 204 ? null : res.json();
}

export function PublicRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [data, setData] = useState<PublicRecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [servings, setServings] = useState<number | null>(null);

  const [stock, setStock] = useState<StockItem[]>([]);
  const [listNames, setListNames] = useState<Set<string>>(new Set());
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [cookLoaded, setCookLoaded] = useState(false);
  const [addingList, setAddingList] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/api/public/recipes/${id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d: PublicRecipeData | null) => {
        setData(d);
        setServings(d?.recipe.servings ?? null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  const baseServings = data?.recipe.servings ?? 0;
  const targetServings = servings ?? baseServings;
  const scale = baseServings > 0 && targetServings > 0 ? targetServings / baseServings : 1;

  // Load the signed-in user's pantry + shopping list so we can flag which
  // ingredients they already have and which to offer for the shopping list.
  useEffect(() => {
    if (!data?.isLoggedIn) return;
    let cancelled = false;
    Promise.all([
      apiCall("/api/items") as Promise<StockItem[]>,
      apiCall("/api/shopping-list") as Promise<{ name: string }[]>,
    ])
      .then(([items, list]) => {
        if (cancelled) return;
        setStock(items);
        setListNames(new Set(list.map((e) => normalizeName(e.name))));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCookLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [data?.isLoggedIn]);

  const stockByName = useMemo(
    () => new Map(stock.map((item) => [normalizeName(item.name), item])),
    [stock],
  );

  // Compare each ingredient (at the chosen serving scale) against the pantry.
  const cook = useMemo(() => {
    const rows = data?.recipe.ingredients ?? [];
    const status = rows.map((row): "have" | "missing" | "none" => {
      if (!row.name?.trim()) return "none";
      const item = stockByName.get(normalizeName(row.name));
      if (!item) return "missing";
      return hasEnoughStock(row.quantity * scale, row.unit, item.quantity, item.unit) === false
        ? "missing"
        : "have";
    });
    const named = status.filter((s) => s !== "none").length;
    const have = status.filter((s) => s === "have").length;
    const missing: { name: string; unit: string; key: string }[] = [];
    const seen = new Set<string>();
    rows.forEach((row, i) => {
      if (status[i] !== "missing" || !row.name?.trim()) return;
      const key = normalizeName(row.name);
      if (seen.has(key)) return;
      seen.add(key);
      missing.push({ name: row.name, unit: row.unit, key });
    });
    return { status, named, have, missing };
  }, [data, stockByName, scale]);

  const addableMissing = cook.missing.filter(
    (m) => !listNames.has(m.key) && !addedNames.has(m.key),
  );

  async function handleAddMissing() {
    if (addableMissing.length === 0) return;
    setAddingList(true);
    try {
      for (const m of addableMissing) {
        await apiCall("/api/shopping-list", {
          method: "POST",
          body: JSON.stringify({ name: m.name, unit: m.unit }),
        });
      }
      setAddedNames((prev) => new Set([...prev, ...addableMissing.map((m) => m.key)]));
    } finally {
      setAddingList(false);
    }
  }

  async function handleRate(stars: number) {
    if (!data || !id) return;
    const rating = await apiCall(`/api/public/recipes/${id}/rating`, {
      method: "PUT",
      body: JSON.stringify({ stars }),
    });
    setData({ ...data, rating });
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !id || !commentText.trim()) return;
    setPostingComment(true);
    try {
      const comment = await apiCall(`/api/public/recipes/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setData({ ...data, comments: [comment, ...data.comments] });
      setCommentText("");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!data || !id) return;
    await apiCall(`/api/public/recipes/${id}/comments/${commentId}`, { method: "DELETE" });
    setData({ ...data, comments: data.comments.filter((c) => c._id !== commentId) });
  }

  async function handleSave() {
    if (!data || !id) return;
    setSaving(true);
    try {
      await apiCall(`/api/public/recipes/${id}/save`, { method: "POST" });
      setData({ ...data, saved: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCooked() {
    if (!data || !id) return;
    setCooking(true);
    try {
      const res = await apiCall(`/api/public/recipes/${id}/cooked`, { method: "POST" });
      setData({ ...data, cooked: res.cooked, cookedCount: res.count });
    } finally {
      setCooking(false);
    }
  }

  const canInteract = data && data.isLoggedIn && !data.isOwner;

  return (
    <div className="flex min-h-svh flex-col lg:pl-20">
      <Header
        left={
          <button onClick={() => setSidebarOpen(true)} aria-label={t.nav.openMenu} className="text-muted lg:hidden">
            <MenuIcon className="h-6 w-6" />
          </button>
        }
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : !data ? (
          <EmptyState
            illustration={<EmptyShelfIllustration />}
            title={t.publicRecipe.notFoundTitle}
            description={t.publicRecipe.notFoundDesc}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/explorar"
                className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
              >
                <BackIcon className="h-4 w-4" />
                {t.explore.backToExplore}
              </Link>
              {data.isOwner && (
                <button
                  onClick={() => navigate(`/receitas?editar=${data.recipe._id}`)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  {t.publicRecipe.edit}
                </button>
              )}
            </div>

            {data.isOwner && !data.recipe.isPublic && (
              <p className="rounded-lg bg-mustard-100 px-3 py-2 text-sm text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400">
                {t.publicRecipe.privateNotice}
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-4 lg:col-span-2">
            <PhotoOrFallback
              src={data.recipe.imageUrl}
              imgClassName="h-56 w-full rounded-xl object-cover"
              fallback={
                <div className="flex h-56 w-full items-center justify-center rounded-xl bg-mustard-100 dark:bg-mustard-900/30">
                  <BowlIllustration className="h-24 w-auto" />
                </div>
              }
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold">{data.recipe.name}</h1>
                {data.authorName && (
                  <p className="mt-0.5 text-sm text-muted">{t.publicRecipe.by(data.authorName)}</p>
                )}
              </div>

              {canInteract && (
                <button
                  onClick={handleSave}
                  disabled={saving || data.saved}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    data.saved
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                      : "bg-primary-600 text-white"
                  }`}
                >
                  <BookmarkIcon className="h-4 w-4" filled={data.saved} />
                  {data.saved ? t.publicRecipe.saved : t.publicRecipe.save}
                </button>
              )}
            </div>

            {(data.recipe.category || data.recipe.prepTime != null || data.recipe.servings != null) && (
              <div className="flex flex-wrap gap-x-3 text-sm text-muted">
                {data.recipe.category && <span>{tagLabel(t, data.recipe.category)}</span>}
                {data.recipe.prepTime != null && <span>{data.recipe.prepTime} {t.units.min}</span>}
                {data.recipe.servings != null && <span>{t.units.servings(data.recipe.servings)}</span>}
              </div>
            )}

            {(data.cookedCount > 0 || data.savedCount > 0 || data.comments.length > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                {data.cookedCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <CookedIcon className="h-4 w-4" />
                    {t.publicRecipe.cookedCount(data.cookedCount)}
                  </span>
                )}
                {data.savedCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookmarkIcon className="h-4 w-4" filled />
                    {t.publicRecipe.savedCount(data.savedCount)}
                  </span>
                )}
                {data.comments.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <ChatIcon className="h-4 w-4" />
                    {data.comments.length}
                  </span>
                )}
              </div>
            )}

            {data.recipe.ingredients.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {t.publicRecipe.ingredients}
                  </p>
                  {baseServings > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setServings((s) => Math.max(1, (s ?? baseServings) - 1))}
                        aria-label={t.publicRecipe.fewerServings}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 disabled:opacity-40"
                        disabled={targetServings <= 1}
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-18 text-center text-xs text-muted tabular-nums">
                        {t.units.servings(targetServings)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setServings((s) => (s ?? baseServings) + 1)}
                        aria-label={t.publicRecipe.moreServings}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <ul className="space-y-1 text-sm">
                  {data.recipe.ingredients.map((row, index) => {
                    const st = cook.status[index];
                    const showStatus = data.isLoggedIn && cookLoaded && st !== "none";
                    return (
                      <li key={index} className="flex items-center gap-2 text-muted">
                        {showStatus &&
                          (st === "have" ? (
                            <CheckIcon className="h-4 w-4 shrink-0 text-primary-600" />
                          ) : (
                            <CartIcon className="h-4 w-4 shrink-0 text-mustard-500" />
                          ))}
                        <span className={showStatus && st === "missing" ? "font-medium text-ink" : ""}>
                          {formatQuantity(row.quantity * scale, row.unit)} {unitLabel(t, row.unit)} {t.units.of} {row.name || t.publicRecipe.removedItem}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {data.isLoggedIn && cookLoaded && cook.named > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 p-3">
                    <p className="text-sm font-medium">
                      {cook.have === cook.named
                        ? t.publicRecipe.haveAllTitle
                        : t.publicRecipe.haveCount(cook.have, cook.named)}
                    </p>
                    {addableMissing.length > 0 ? (
                      <button
                        onClick={handleAddMissing}
                        disabled={addingList}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                      >
                        <CartIcon className="h-4 w-4" />
                        {t.publicRecipe.addMissing(addableMissing.length)}
                      </button>
                    ) : cook.missing.length > 0 ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-primary-700 dark:text-primary-400">
                        <CheckIcon className="h-4 w-4" />
                        {t.publicRecipe.missingInList}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {data.recipe.steps.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  {t.publicRecipe.steps}
                </p>
                <ol className="list-inside list-decimal space-y-1 text-sm">
                  {data.recipe.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* "Fiz esta receita" — no fim, depois do modo de preparo. */}
            {data.isLoggedIn && (
              <button
                onClick={handleToggleCooked}
                disabled={cooking}
                aria-pressed={data.cooked}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 ${
                  data.cooked
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                    : "bg-primary-600 text-white"
                }`}
              >
                {data.cooked ? <CheckIcon className="h-4 w-4" /> : <CookedIcon className="h-4 w-4" />}
                {data.cooked ? t.publicRecipe.cookedDone : t.publicRecipe.cookedMark}
              </button>
            )}
            </div>

            <div className="space-y-4">
            {/* Avaliação */}
            <div className="border-t border-line pt-4 lg:border-t-0 lg:pt-0">
            <div className="rounded-xl bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums">
                  {data.rating.count > 0 ? data.rating.average.toFixed(1) : "—"}
                </span>
                <span className="text-sm text-muted">
                  {data.rating.count === 0
                    ? t.publicRecipe.noRatings
                    : t.publicRecipe.ratings(data.rating.count)}
                </span>
              </div>

              {canInteract ? (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-muted">
                    {data.rating.mine ? t.publicRecipe.yourRating : t.publicRecipe.rateThis}
                  </p>
                  <div className="flex gap-1" onMouseLeave={() => setRatingHover(0)}>
                    {STARS.map((star) => {
                      const active = star <= (ratingHover || data.rating.mine || 0);
                      return (
                        <button
                          key={star}
                          onClick={() => handleRate(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          aria-label={t.publicRecipe.starsAria(star)}
                          className={active ? "text-mustard-500" : "text-muted"}
                        >
                          <StarIcon className="h-7 w-7" filled={active} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                data.rating.count > 0 && (
                  <div className="mt-1 flex gap-0.5 text-mustard-500">
                    {STARS.map((star) => (
                      <StarIcon
                        key={star}
                        className="h-4 w-4"
                        filled={star <= Math.round(data.rating.average)}
                      />
                    ))}
                  </div>
                )
              )}

              {!data.isLoggedIn && (
                <p className="mt-2 text-xs text-muted">
                  <Link to="/login" className="text-primary-600 underline">
                    {t.publicRecipe.loginLink}
                  </Link>{" "}
                  {t.publicRecipe.loginPrompt}
                </p>
              )}
            </div>
            </div>

            {/* Comentários */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                {t.publicRecipe.comments(data.comments.length)}
              </p>

              {canInteract && (
                <form onSubmit={handlePostComment} className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t.publicRecipe.commentPlaceholder}
                    maxLength={1000}
                    className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={postingComment || !commentText.trim()}
                    className="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                </form>
              )}

              {data.comments.length === 0 ? (
                <p className="text-sm text-muted">{t.publicRecipe.noComments}</p>
              ) : (
                <ul className="space-y-3">
                  {data.comments.map((comment) => (
                    <li key={comment._id} className="rounded-lg bg-surface-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-medium">{comment.authorName}</p>
                          <span className="text-xs text-muted">{formatCommentDate(comment.createdAt, lang === "pt" ? "pt-BR" : "en-US")}</span>
                        </div>
                        {comment.mine && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-xs text-rust-600"
                          >
                            {t.common.delete}
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">{comment.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
