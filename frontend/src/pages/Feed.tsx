import { useEffect, useState } from "react";
import { social, type PostView } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { PostCard } from "../components/social/PostCard";
import { ComposeSheet } from "../components/social/ComposeSheet";
import { Fab } from "../components/ui/Fab";
import { PlusIcon } from "../components/icons";
import { EmptyState } from "../components/ui/EmptyState";
import { EmptyShelfIllustration } from "../components/illustrations";

export function Feed() {
  const { t } = useI18n();
  const [items, setItems] = useState<PostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    social
      .feed()
      .then((r) => {
        setItems(r.items);
        setCursor(r.nextCursor);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (!cursor) return;
    const r = await social.feed(cursor);
    setItems((x) => [...x, ...r.items]);
    setCursor(r.nextCursor);
  }

  return (
    <div className="space-y-4 pb-16">
      <h1 className="font-display text-xl font-bold">{t.social.feedTitle}</h1>

      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<EmptyShelfIllustration />}
          title={t.social.feedEmpty}
          description={t.social.feedEmptyHint}
        />
      ) : (
        <div className="mx-auto max-w-xl space-y-3">
          {items.map((p) => (
            <PostCard key={p.id} post={p} onDeleted={(id) => setItems((x) => x.filter((q) => q.id !== id))} />
          ))}
          {cursor && (
            <button
              onClick={loadMore}
              className="mx-auto block rounded-lg bg-surface-2 px-4 py-2 text-sm font-medium"
            >
              {t.social.loadMore}
            </button>
          )}
        </div>
      )}

      <Fab onClick={() => setComposing(true)} label={t.social.publish} icon={<PlusIcon className="h-6 w-6" />} />
      {composing && (
        <ComposeSheet
          onClose={() => setComposing(false)}
          onPosted={(p) => {
            setItems((x) => [p, ...x]);
            setComposing(false);
          }}
        />
      )}
    </div>
  );
}
