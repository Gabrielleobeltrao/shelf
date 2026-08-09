import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { social, type PostView } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { PostCard } from "../components/social/PostCard";

export function Tag() {
  const { tag = "" } = useParams();
  const { t } = useI18n();
  const [items, setItems] = useState<PostView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    social
      .tagFeed(tag)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <div className="space-y-4 pb-16">
      <h1 className="font-display text-xl font-bold">#{tag}</h1>
      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">{t.social.noPosts}</p>
      ) : (
        <div className="mx-auto max-w-xl space-y-3">
          {items.map((p) => (
            <PostCard key={p.id} post={p} onDeleted={(id) => setItems((x) => x.filter((q) => q.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
