import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  collectionsApi,
  type CollectionDetail as CollectionData,
  type RecipeSummary,
} from "../lib/collections";
import { useI18n } from "../lib/i18n";
import { tagLabel } from "../lib/labels";
import { EmptyState } from "../components/ui/EmptyState";
import { EmptyShelfIllustration, BowlIllustration } from "../components/illustrations";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { BackIcon, CloseIcon, PencilIcon, PlusIcon, ShareIcon, TrashIcon } from "../components/icons";

export function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [data, setData] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    collectionsApi
      .get(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !data || !nameDraft.trim()) return;
    const res = await collectionsApi.update(id, { name: nameDraft.trim() });
    setData({ ...data, name: res.name });
    setRenaming(false);
  }

  async function togglePublic() {
    if (!id || !data) return;
    setBusy(true);
    try {
      const res = await collectionsApi.update(id, { isPublic: !data.isPublic });
      setData({ ...data, isPublic: res.isPublic });
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!id || !data) return;
    if (!data.isPublic) {
      await collectionsApi.update(id, { isPublic: true }).catch(() => {});
      setData((d) => (d ? { ...d, isPublic: true } : d));
    }
    try {
      await navigator.clipboard?.writeText(`${window.location.origin}/colecao/${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  async function handleDelete() {
    if (!id) return;
    await collectionsApi.remove(id);
    navigate("/colecoes", { replace: true });
  }

  async function removeRecipe(recipeId: string) {
    if (!id || !data) return;
    setData({ ...data, recipes: data.recipes.filter((r) => r._id !== recipeId) });
    await collectionsApi.removeRecipe(id, recipeId).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <Link
        to="/colecoes"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <BackIcon className="h-4 w-4" />
        {t.collections.title}
      </Link>

      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : !data ? (
        <EmptyState
          illustration={<EmptyShelfIllustration />}
          title={t.collections.notFoundTitle}
          description={t.collections.notFoundDesc}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            {renaming ? (
              <form onSubmit={handleRename} className="flex flex-1 gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={80}
                  className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-1.5 text-base"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  {t.collections.save}
                </button>
              </form>
            ) : (
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">{data.name}</h1>
                <button
                  onClick={togglePublic}
                  disabled={busy}
                  className="mt-0.5 text-sm text-muted hover:text-ink"
                >
                  {t.collections.count(data.recipes.length)} ·{" "}
                  {data.isPublic ? t.collections.public : t.collections.private}
                </button>
              </div>
            )}

            {!renaming && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    setNameDraft(data.name);
                    setRenaming(true);
                  }}
                  aria-label={t.collections.rename}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleShare}
                  aria-label={t.collections.share}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink"
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  aria-label={t.common.delete}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-rust-600 dark:text-rust-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {copied && <p className="text-sm font-medium text-primary-600">{t.collections.linkCopied}</p>}

          {data.recipes.length === 0 ? (
            <EmptyState
              illustration={<BowlIllustration className="h-20 w-auto" />}
              title={t.collections.emptyCollectionTitle}
              description={t.collections.emptyCollectionDesc}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.recipes.map((r) => (
                <li key={r._id} className="relative">
                  <Link
                    to={`/receita/${r._id}`}
                    className="block overflow-hidden rounded-lg border border-line"
                  >
                    <PhotoOrFallback
                      src={r.imageUrl}
                      imgClassName="h-32 w-full object-cover"
                      fallback={
                        <div className="flex h-24 w-full items-center justify-center bg-mustard-100 dark:bg-mustard-900/30">
                          <BowlIllustration className="h-14 w-auto" />
                        </div>
                      }
                    />
                    <div className="space-y-1 p-3">
                      <p className="truncate font-medium">{r.name}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted">
                        {r.category && <span>{tagLabel(t, r.category)}</span>}
                        {r.prepTime != null && <span>{r.prepTime} {t.units.min}</span>}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeRecipe(r._id)}
                    aria-label={t.collections.removeFromCollection}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-on-photo text-rust-600 shadow-sm dark:text-rust-400"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-2.5 text-sm font-medium text-primary-600"
          >
            <PlusIcon className="h-4 w-4" />
            {t.collections.addRecipes}
          </button>
        </>
      )}

      {adding && data && id && (
        <AddRecipesModal
          collectionId={id}
          existingIds={data.recipes.map((r) => r._id)}
          onClose={() => setAdding(false)}
          onAdded={(recipe) => setData((d) => (d ? { ...d, recipes: [...d.recipes, recipe] } : d))}
        />
      )}

      {confirmDelete && data && (
        <ConfirmDialog
          title={t.collections.deleteTitle(data.name)}
          description={t.collections.deleteDesc}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function AddRecipesModal({
  collectionId,
  existingIds,
  onClose,
  onAdded,
}: {
  collectionId: string;
  existingIds: string[];
  onClose: () => void;
  onAdded: (recipe: RecipeSummary) => void;
}) {
  const { t } = useI18n();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<RecipeSummary[]>("/api/recipes")
      .then((all) => setRecipes(all.filter((r) => !existingIds.includes(r._id))))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Snapshot the excluded ids on open; the list is short-lived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add(recipe: RecipeSummary) {
    setAddingId(recipe._id);
    try {
      await collectionsApi.addRecipe(collectionId, recipe._id);
      onAdded(recipe);
      setRecipes((prev) => prev.filter((x) => x._id !== recipe._id));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col space-y-3 rounded-t-2xl bg-surface p-4 sm:mx-auto sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.collections.addTitle}</h2>
          <button onClick={onClose} aria-label={t.common.close} className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted">{t.common.loading}</p>
          ) : recipes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t.collections.noRecipesToAdd}</p>
          ) : (
            recipes.map((r) => (
              <button
                key={r._id}
                onClick={() => add(r)}
                disabled={addingId === r._id}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-2 disabled:opacity-60"
              >
                <PhotoOrFallback
                  src={r.imageUrl}
                  imgClassName="h-11 w-11 shrink-0 rounded-lg object-cover"
                  fallback={<div className="h-11 w-11 shrink-0 rounded-lg bg-surface-2" />}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                <PlusIcon className="h-5 w-5 shrink-0 text-primary-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
