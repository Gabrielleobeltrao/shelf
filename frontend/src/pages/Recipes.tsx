import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { hasEnoughStock } from "../lib/units";
import type { RecipeFormData } from "../components/recipes/RecipeDetailModal";
import { RecipeDetailModal } from "../components/recipes/RecipeDetailModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { BookmarkIcon, ExploreIcon, FilterIcon, FolderIcon, PencilIcon, PlusIcon, SearchIcon } from "../components/icons";
import { EmptyState } from "../components/ui/EmptyState";
import { FabMenu } from "../components/ui/FabMenu";
import { AddToCollectionMenu } from "../components/recipes/AddToCollectionMenu";
import { useI18n } from "../lib/i18n";
import { tagLabel, unitLabel } from "../lib/labels";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { BowlIllustration, EmptyShelfIllustration } from "../components/illustrations";

type RecipeIngredient = {
  itemId: string;
  // Older recipes (before ingredients snapshotted their name) may not have
  // this — always fall back to a placeholder rather than showing "undefined".
  name?: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  _id: string;
  name: string;
  steps?: string[];
  instructions?: string;
  prepTime?: number;
  servings?: number;
  category?: string;
  ingredients: RecipeIngredient[];
  imageUrl?: string;
  isPublic?: boolean;
  // Set on copies saved from another user's public recipe.
  savedFrom?: string;
};

type StockItem = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  barcode?: string;
};

type ModalState =
  | { mode: "create"; initial: Partial<RecipeFormData> }
  | { mode: "edit"; recipeId: string; initial: Partial<RecipeFormData> };

function getSteps(recipe: Recipe): string[] {
  if (recipe.steps && recipe.steps.length > 0) return recipe.steps;
  if (recipe.instructions) return recipe.instructions.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

function editInitialFor(recipe: Recipe, removedLabel: string): Partial<RecipeFormData> {
  return {
    name: recipe.name,
    steps: getSteps(recipe),
    prepTime: recipe.prepTime != null ? String(recipe.prepTime) : "",
    servings: recipe.servings != null ? String(recipe.servings) : "",
    category: recipe.category ?? "",
    imageUrl: recipe.imageUrl ?? "",
    isPublic: recipe.isPublic ?? false,
    ingredients: recipe.ingredients.map((row) => ({
      itemId: row.itemId,
      name: row.name || removedLabel,
      quantity: String(row.quantity),
      unit: row.unit,
    })),
  };
}

export function Recipes() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [originFilter, setOriginFilter] = useState<"all" | "mine" | "saved">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [unsaving, setUnsaving] = useState<Recipe | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    Promise.all([api.get<Recipe[]>("/api/recipes"), api.get<StockItem[]>("/api/items")])
      .then(([recipesData, itemsData]) => {
        setRecipes(recipesData);
        setItems(itemsData);
      })
      .finally(() => setLoading(false));
  }, []);

  // The public recipe page's "Editar" button lands here as /receitas?editar=<id>
  // — open the edit form directly once the data is in.
  useEffect(() => {
    const editId = searchParams.get("editar");
    if (!editId || loading) return;

    const recipe = recipes.find((r) => r._id === editId);
    if (recipe) {
      setModal({ mode: "edit", recipeId: recipe._id, initial: editInitialFor(recipe, t.recipes.removedItem) });
    }
    setSearchParams({}, { replace: true });
  }, [loading, recipes, searchParams, setSearchParams]);

  const itemsById = useMemo(() => new Map(items.map((item) => [item._id, item])), [items]);

  const categories = useMemo(() => {
    const set = new Set(recipes.map((r) => r.category?.trim()).filter(Boolean));
    return [...set].sort((a, b) => a!.localeCompare(b!));
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const term = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      if (categoryFilter && (recipe.category?.trim() || "") !== categoryFilter) return false;
      if (originFilter === "mine" && recipe.savedFrom) return false;
      if (originFilter === "saved" && !recipe.savedFrom) return false;
      if (!term) return true;
      if (recipe.name.toLowerCase().includes(term)) return true;
      return recipe.ingredients.some((row) => row.name?.toLowerCase().includes(term));
    });
  }, [recipes, search, categoryFilter, originFilter]);

  const hasSaved = useMemo(() => recipes.some((r) => r.savedFrom), [recipes]);
  const hasActiveFilter = originFilter !== "all" || categoryFilter !== "";

  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Reset back to the first page whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, categoryFilter, originFilter]);

  const visibleRecipes = filteredRecipes.slice(0, visibleCount);

  function missingIngredients(recipe: Recipe) {
    return recipe.ingredients.filter((row) => {
      const stockItem = itemsById.get(row.itemId);
      if (!stockItem) return true;
      return hasEnoughStock(row.quantity, row.unit, stockItem.quantity, stockItem.unit) === false;
    });
  }

  async function handleSave(data: RecipeFormData) {
    if (!modal) return;

    const payload = {
      name: data.name.trim(),
      steps: data.steps,
      prepTime: data.prepTime.trim() ? Number(data.prepTime) : undefined,
      servings: data.servings.trim() ? Number(data.servings) : undefined,
      category: data.category.trim(),
      imageUrl: data.imageUrl.trim(),
      isPublic: data.isPublic,
      ingredients: data.ingredients.map((row) => ({
        itemId: row.itemId,
        name: row.name,
        quantity: Number(row.quantity) || 1,
        unit: row.unit.trim() || "un",
      })),
    };

    if (modal.mode === "edit") {
      const updated = await api.patch<Recipe>(`/api/recipes/${modal.recipeId}`, payload);
      setRecipes((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } else {
      const created = await api.post<Recipe>("/api/recipes", payload);
      setRecipes((prev) => [created, ...prev]);
    }

    setModal(null);
  }

  async function handleDeleteRecipe(recipeId: string) {
    await api.delete(`/api/recipes/${recipeId}`);
    setRecipes((prev) => prev.filter((r) => r._id !== recipeId));
  }

  async function handleDelete() {
    if (modal?.mode !== "edit") return;
    await handleDeleteRecipe(modal.recipeId);
    setModal(null);
  }

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-lg font-semibold">{t.recipes.title}</h1>

      {recipes.length > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder={t.recipes.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-surface-2 py-2 pl-9 pr-3 text-base"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-label={t.recipes.filter}
              className={`relative flex h-full w-11 items-center justify-center rounded-lg bg-surface-2 ${
                hasActiveFilter ? "text-primary-600" : "text-muted"
              }`}
            >
              <FilterIcon className="h-5 w-5" />
              {hasActiveFilter && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary-600" />
              )}
            </button>

            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-64 space-y-3 rounded-lg border border-line bg-surface p-3 shadow-lg">
                  {hasSaved && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                        {t.recipes.origin}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["all", t.recipes.all],
                            ["mine", t.recipes.mine],
                            ["saved", t.recipes.saved],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setOriginFilter(value)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                              originFilter === value
                                ? "bg-primary-600 text-white"
                                : "bg-surface-2 text-muted"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {categories.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                        {t.recipes.category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => {
                          const active = categoryFilter === category;
                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setCategoryFilter(active ? "" : category!)}
                              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                                active ? "bg-primary-600 text-white" : "bg-surface-2 text-muted"
                              }`}
                            >
                              {tagLabel(t, category)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setOriginFilter("all");
                        setCategoryFilter("");
                      }}
                      className="text-xs font-medium text-primary-600"
                    >
                      {t.recipes.clearFilters}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : recipes.length === 0 ? (
        <EmptyState
          illustration={<EmptyShelfIllustration />}
          title={t.recipes.emptyTitle}
          description={t.recipes.emptyDesc}
        />
      ) : filteredRecipes.length === 0 ? (
        <p className="text-sm text-muted">{t.recipes.notFound}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRecipes.map((recipe) => {
            const missing = missingIngredients(recipe);
            const missingIds = new Set(missing.map((row) => row.itemId));
            const steps = getSteps(recipe);

            const isSaved = !!recipe.savedFrom;

            return (
              <li
                key={recipe._id}
                onClick={() => navigate(`/receita/${isSaved ? recipe.savedFrom : recipe._id}`)}
                className="relative cursor-pointer overflow-hidden rounded-lg border border-line"
              >
                <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollectingId(recipe._id);
                    }}
                    aria-label={t.collections.addToCollection}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-on-photo text-ink shadow-sm"
                  >
                    <FolderIcon className="h-4 w-4" />
                  </button>
                  {isSaved ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnsaving(recipe);
                      }}
                      aria-label={t.recipes.unsaveAria(recipe.name)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-on-photo text-primary-600 shadow-sm"
                    >
                      <BookmarkIcon className="h-4 w-4" filled />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ mode: "edit", recipeId: recipe._id, initial: editInitialFor(recipe, t.recipes.removedItem) });
                      }}
                      aria-label={t.recipes.editAria(recipe.name)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-on-photo text-ink shadow-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <PhotoOrFallback
                  src={recipe.imageUrl}
                  imgClassName="h-40 w-full object-cover"
                  fallback={
                    <div className="flex h-28 w-full items-center justify-center bg-mustard-100 dark:bg-mustard-900/30">
                      <BowlIllustration className="h-16 w-auto" />
                    </div>
                  }
                />

                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-bold">{recipe.name}</h2>
                    {/* Saved recipes are reference-only (ingredients aren't
                        linked to the user's stock), so the stock-availability
                        badge only applies to the user's own recipes. */}
                    {!isSaved &&
                      recipe.ingredients.length > 0 &&
                      (missing.length === 0 ? (
                        <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                          {t.recipes.canMake}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-mustard-100 px-2 py-0.5 text-xs font-semibold text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400">
                          {t.recipes.missing(missing.length)}
                        </span>
                      ))}
                  </div>

                  {(recipe.category ||
                    recipe.prepTime ||
                    recipe.servings ||
                    recipe.isPublic ||
                    recipe.savedFrom) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      {recipe.savedFrom && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                          {t.recipes.savedBadge}
                        </span>
                      )}
                      {recipe.isPublic && (
                        <span className="rounded-full bg-mustard-100 px-2 py-0.5 font-medium text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400">
                          {t.recipes.publicBadge}
                        </span>
                      )}
                      {recipe.category && <span>{tagLabel(t, recipe.category)}</span>}
                      {recipe.prepTime != null && <span>{recipe.prepTime} {t.units.min}</span>}
                      {recipe.servings != null && <span>{t.units.servings(recipe.servings)}</span>}
                    </div>
                  )}

                  {recipe.ingredients.length > 0 && (
                    <ul className="space-y-0.5 text-sm">
                      {recipe.ingredients.map((row, index) => (
                        <li
                          key={`${row.itemId}-${index}`}
                          className={
                            missingIds.has(row.itemId)
                              ? "text-rust-600 dark:text-rust-400"
                              : "text-muted"
                          }
                        >
                          {row.quantity} {unitLabel(t, row.unit)} {t.units.of} {row.name || t.recipes.removedItem}
                        </li>
                      ))}
                    </ul>
                  )}

                  {steps.length > 0 && (
                    <ol className="list-inside list-decimal space-y-0.5 text-sm">
                      {steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {visibleRecipes.length < filteredRecipes.length && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mx-auto block rounded-lg bg-surface-2 px-4 py-2 text-sm font-medium"
        >
          {t.common.loadMore}
        </button>
      )}

      {modal && (
        <RecipeDetailModal
          title={modal.mode === "edit" ? t.recipeForm.editRecipe : t.recipeForm.newRecipe}
          initial={modal.initial}
          stockItems={items}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDelete : undefined}
          onItemCreated={(item) => setItems((prev) => [item, ...prev])}
        />
      )}

      {unsaving && (
        <ConfirmDialog
          title={t.recipes.removeSavedTitle(unsaving.name)}
          description={t.recipes.removeSavedDesc}
          confirmLabel={t.common.remove}
          onConfirm={() => {
            handleDeleteRecipe(unsaving._id);
            setUnsaving(null);
          }}
          onCancel={() => setUnsaving(null)}
        />
      )}

      {collectingId && (
        <AddToCollectionMenu recipeId={collectingId} onClose={() => setCollectingId(null)} />
      )}

      <FabMenu
        label={t.recipes.openActions}
        actions={[
          {
            label: t.recipes.exploreRecipes,
            icon: <ExploreIcon className="h-5 w-5" />,
            onClick: () => navigate("/explorar"),
          },
          {
            label: t.recipes.addRecipe,
            icon: <PlusIcon className="h-5 w-5" />,
            onClick: () =>
              setModal({
                mode: "create",
                initial: { ingredients: [], imageUrl: "", steps: [] },
              }),
          },
        ]}
      />
    </div>
  );
}
