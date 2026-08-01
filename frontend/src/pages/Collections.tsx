import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collectionsApi, type CollectionListItem } from "../lib/collections";
import { useI18n } from "../lib/i18n";
import { EmptyState } from "../components/ui/EmptyState";
import { EmptyShelfIllustration } from "../components/illustrations";
import { Fab } from "../components/ui/Fab";
import { Switch } from "../components/ui/Switch";
import { CloseIcon, FolderIcon, PlusIcon } from "../components/icons";

// A collection's cover is a mosaic of up to four of its recipe photos, laid
// out by how many there are (1 = full, 2 = split, 3–4 = 2×2 grid).
function CollectionCover({ covers }: { covers: string[] }) {
  if (covers.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-mustard-100 text-mustard-500 dark:bg-mustard-900/30 dark:text-mustard-400">
        <FolderIcon className="h-10 w-10" />
      </div>
    );
  }
  const shots = covers.slice(0, 4);
  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-px bg-line">
      {shots.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className={`h-full w-full object-cover ${
            shots.length === 1 ? "col-span-2 row-span-2" : shots.length === 2 ? "row-span-2" : ""
          }`}
        />
      ))}
      {shots.length === 3 && <div className="bg-mustard-100 dark:bg-mustard-900/30" />}
    </div>
  );
}

export function Collections() {
  const { t } = useI18n();
  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    collectionsApi
      .list()
      .then(setCollections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 pb-16">
      <div>
        <h1 className="text-lg font-semibold">{t.collections.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.collections.subtitle}</p>
      </div>

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
                <div className="relative h-28 overflow-hidden">
                  <CollectionCover covers={c.covers ?? []} />
                  {c.isPublic && (
                    <span className="absolute right-2 top-2 rounded-full bg-on-photo px-2 py-0.5 text-xs font-medium text-ink">
                      {t.collections.public}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 p-3">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted">{t.collections.count(c.recipeIds?.length ?? 0)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Fab
        onClick={() => setCreating(true)}
        label={t.collections.newCollection}
        icon={<PlusIcon className="h-6 w-6" />}
      />

      {creating && (
        <NewCollectionModal
          onClose={() => setCreating(false)}
          onCreated={(c) => setCollections((prev) => [c, ...prev])}
        />
      )}
    </div>
  );
}

function NewCollectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (collection: CollectionListItem) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await collectionsApi.create(name.trim(), isPublic);
      onCreated(created);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full space-y-3 rounded-t-2xl bg-surface p-4 sm:mx-auto sm:max-w-sm sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.collections.newCollection}</h2>
          <button type="button" onClick={onClose} aria-label={t.common.close} className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.collections.namePlaceholder}
          maxLength={80}
          className="w-full rounded-lg bg-surface-2 px-3 py-2 text-base"
        />
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <Switch
            checked={isPublic}
            onChange={setIsPublic}
            label={t.collections.publicLabel}
            description={t.collections.publicHint}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {t.collections.create}
        </button>
      </form>
    </div>
  );
}
