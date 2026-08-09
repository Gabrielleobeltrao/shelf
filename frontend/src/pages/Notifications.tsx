import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { social, type NotificationView } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { Avatar } from "../components/social/Avatar";
import { timeAgo } from "../lib/timeAgo";

export function Notifications() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    social
      .notifications()
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
    social.markNotificationsRead().catch(() => {});
  }, []);

  function label(n: NotificationView) {
    const name = n.actor?.name || `@${n.actor?.handle ?? ""}`;
    return n.type === "follow"
      ? t.social.notifFollow(name)
      : n.type === "accept"
        ? t.social.notifAccept(name)
        : n.type === "like"
          ? t.social.notifLike(name)
          : t.social.notifComment(name);
  }

  return (
    <div className="space-y-4 pb-16">
      <h1 className="font-display text-xl font-bold">{t.social.notificationsTitle}</h1>
      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">{t.social.noNotifications}</p>
      ) : (
        <div className="mx-auto max-w-xl space-y-1">
          {items.map((n) => (
            <Link
              key={n.id}
              to={`/perfil/${n.actor?.handle ?? ""}`}
              className={`flex items-center gap-3 rounded-xl p-3 ${n.read ? "" : "bg-surface-2"}`}
            >
              <Avatar src={n.actor?.avatarUrl} name={n.actor?.name || "?"} size={40} />
              <p className="min-w-0 flex-1 text-sm">{label(n)}</p>
              <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt, lang)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
