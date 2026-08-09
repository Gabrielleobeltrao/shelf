import { useState } from "react";
import { Link } from "react-router-dom";
import { social, type DiscoverCard } from "../../lib/social";
import { useI18n } from "../../lib/i18n";
import { Avatar } from "./Avatar";

// A person row with a follow toggle — used in Discover and follower lists.
export function UserRow({ user }: { user: DiscoverCard }) {
  const { t } = useI18n();
  const [state, setState] = useState(user.followState);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state === "none") {
      const r = await social.follow(user.userId);
      setState(r.status as typeof state);
    } else {
      await social.unfollow(user.userId);
      setState("none");
    }
  }

  const label =
    state === "accepted" ? t.social.followingBtn : state === "pending" ? t.social.requested : t.social.follow;

  return (
    <Link to={`/perfil/${user.handle}`} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
      <Avatar src={user.avatarUrl} name={user.name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{user.name || `@${user.handle}`}</p>
        <p className="truncate text-xs text-muted">@{user.handle}</p>
      </div>
      <button
        onClick={toggle}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
          state === "none" ? "bg-primary-600 text-white" : "border border-line text-ink"
        }`}
      >
        {label}
      </button>
    </Link>
  );
}
