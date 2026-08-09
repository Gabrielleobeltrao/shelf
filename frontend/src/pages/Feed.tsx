import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { social, type PostView } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { PostCard } from "../components/social/PostCard";
import { ComposeSheet } from "../components/social/ComposeSheet";
import { CheckinSheet } from "../components/social/CheckinSheet";
import { FabMenu } from "../components/ui/FabMenu";
import { PencilIcon, ExploreIcon, SearchIcon, BellIcon } from "../components/icons";
import { EmptyState } from "../components/ui/EmptyState";
import { EmptyShelfIllustration } from "../components/illustrations";

export function Feed() {
  const { t } = useI18n();
  const [items, setItems] = useState<PostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [checkin, setCheckin] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    social
      .notifications()
      .then((r) => setUnread(r.unread))
      .catch(() => {});
  }, []);

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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">{t.social.feedTitle}</h1>
        <div className="flex items-center gap-4 text-muted">
          <Link to="/descobrir" aria-label={t.social.discoverTitle}>
            <SearchIcon className="h-5 w-5" />
          </Link>
          <Link to="/notificacoes" aria-label={t.social.notificationsTitle} className="relative">
            <BellIcon className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust-600 px-1 text-[0.6rem] font-semibold leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </div>
      </div>

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

      <FabMenu
        label={t.social.publish}
        actions={[
          {
            label: t.social.publish,
            icon: <PencilIcon className="h-5 w-5" />,
            onClick: () => setComposing(true),
          },
          {
            label: t.social.checkin,
            icon: <ExploreIcon className="h-5 w-5" />,
            onClick: () => setCheckin(true),
          },
        ]}
      />
      {composing && (
        <ComposeSheet
          onClose={() => setComposing(false)}
          onPosted={(p) => {
            setItems((x) => [p, ...x]);
            setComposing(false);
          }}
        />
      )}
      {checkin && (
        <CheckinSheet
          onClose={() => setCheckin(false)}
          onDone={async () => {
            setCheckin(false);
            const r = await social.feed();
            setItems(r.items);
            setCursor(r.nextCursor);
          }}
        />
      )}
    </div>
  );
}
