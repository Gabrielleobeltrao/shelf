import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collectionsApi, type CollectionListItem } from "../lib/collections";
import { useI18n } from "../lib/i18n";
import { EmptyState } from "../components/ui/EmptyState";
import { EmptyShelfIllustration } from "../components/illustrations";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { FolderIcon, PlusIcon } from "../components/icons";

export function Collections() {
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await collectionsApi.create(name.trim());
      setCollections((prev) => [created, ...prev]);
      setName("");
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">{t.collections.title}</h1>
          <p className="mt-0.5 text-sm text-muted">{t.collections.subtitle}</p>
        </div>
        <button
          onClick={() => setCreating((c) => !c)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white"
        >
          <PlusIcon className="h-4 w-4" />
          {t.collections.newCollection}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.collections.namePlaceholder}
            maxLength={80}
            className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-base"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t.collections.create}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : collections.length === 0 ? (
        <EmptyState
          illustration={<EmptyShelfIllustration />}
          title={t.collections.emptyTitle}
          description={t.collections.emptyDesc}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {collections.map((c) => (
            <li key={c._id}>
              <Link to={`/colecoes/${c._id}`} className="block overflow-hidden rounded-lg border border-line">
                <div className="relative h-28 bg-mustard-100 dark:bg-mustard-900/30">
                  <PhotoOrFallback
                    src={c.covers[0]}
                    imgClassName="h-full w-full object-cover"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center text-mustard-500 dark:text-mustard-400">
                        <FolderIcon className="h-10 w-10" />
                      </div>
                    }
                  />
                  {c.isPublic && (
                    <span className="absolute right-2 top-2 rounded-full bg-on-photo px-2 py-0.5 text-xs font-medium text-ink">
                      {t.collections.public}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 p-3">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted">{t.collections.count(c.recipeIds.length)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
