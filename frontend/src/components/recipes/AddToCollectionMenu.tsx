import { useEffect, useState } from "react";
import { collectionsApi, type CollectionListItem } from "../../lib/collections";
import { useI18n } from "../../lib/i18n";
import { CheckIcon, CloseIcon, PlusIcon } from "../icons";

// Bottom-sheet menu to toggle a recipe in/out of the user's collections,
// with an inline "new collection" that also adds the recipe.
export function AddToCollectionMenu({ recipeId, onClose }: { recipeId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    collectionsApi
      .list()
      .then(setCollections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle(c: CollectionListItem) {
    const inIt = c.recipeIds.includes(recipeId);
    const flip = (add: boolean) =>
      setCollections((prev) =>
        prev.map((x) =>
          x._id === c._id
            ? {
                ...x,
                recipeIds: add
                  ? [...x.recipeIds, recipeId]
                  : x.recipeIds.filter((id) => id !== recipeId),
              }
            : x,
        ),
      );

    flip(!inIt);
    try {
      if (inIt) await collectionsApi.removeRecipe(c._id, recipeId);
      else await collectionsApi.addRecipe(c._id, recipeId);
    } catch {
      flip(inIt); // revert
    }
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await collectionsApi.create(name.trim());
      await collectionsApi.addRecipe(created._id, recipeId);
      setCollections((prev) => [{ ...created, recipeIds: [recipeId] }, ...prev]);
      setName("");
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full space-y-2 rounded-t-2xl bg-surface p-4 sm:mx-auto sm:max-w-sm sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.collections.addToCollection}</h2>
          <button onClick={onClose} aria-label={t.common.close} className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="py-4 text-sm text-muted">{t.common.loading}</p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {collections.map((c) => {
              const inIt = c.recipeIds.includes(recipeId);
              return (
                <button
                  key={c._id}
                  onClick={() => toggle(c)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      inIt ? "border-primary-600 bg-primary-600 text-white" : "border-line"
                    }`}
                  >
                    {inIt && <CheckIcon className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {creating ? (
          <form onSubmit={createAndAdd} className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.collections.namePlaceholder}
              maxLength={80}
              className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {t.collections.create}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-primary-600"
          >
            <PlusIcon className="h-4 w-4" />
            {t.collections.newCollection}
          </button>
        )}
      </div>
    </div>
  );
}
