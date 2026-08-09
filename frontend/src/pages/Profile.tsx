import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { social, type ProfileView, type PostView } from "../lib/social";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { canMakeRecipe } from "../lib/recipeStock";
import { daysUntil } from "../lib/expiration";
import { Avatar } from "../components/social/Avatar";
import { PostCard } from "../components/social/PostCard";
import { Portal } from "../components/ui/Portal";
import { PencilIcon, CloseIcon } from "../components/icons";
import { Switch } from "../components/ui/Switch";

type StockItem = { _id: string; quantity: number; unit: string; expirationDate?: string };
type RecipeLite = { savedFrom?: string; ingredients: { itemId?: string; quantity: number; unit: string }[] };

export function Profile() {
  const { handle = "" } = useParams();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [posts, setPosts] = useState<PostView[]>([]);
  const [tab, setTab] = useState<"posts" | "kitchen">("posts");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setTab("posts");
    const target = handle && handle !== "me" ? handle : null;
    const load = target
      ? Promise.all([social.profile(target), social.userPosts(target)])
      : social.myProfile().then(async (p) => [p, await social.userPosts(p.handle)] as [ProfileView, PostView[]]);
    load
      .then(([p, ps]) => {
        setProfile(p);
        setPosts(ps);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [handle]);

  async function toggleFollow() {
    if (!profile) return;
    const following = profile.followState === "accepted" || profile.followState === "pending";
    if (following) {
      await social.unfollow(profile.userId);
      setProfile({
        ...profile,
        followState: "none",
        followers: profile.followState === "accepted" ? profile.followers - 1 : profile.followers,
      });
    } else {
      const r = await social.follow(profile.userId);
      setProfile({
        ...profile,
        followState: r.status as ProfileView["followState"],
        followers: r.status === "accepted" ? profile.followers + 1 : profile.followers,
      });
    }
  }

  if (loading) return <p className="text-sm text-muted">{t.common.loading}</p>;
  if (notFound || !profile) return <p className="text-sm text-muted">{t.social.profileNotFound}</p>;

  const followLabel =
    profile.followState === "accepted"
      ? t.social.followingBtn
      : profile.followState === "pending"
        ? t.social.requested
        : t.social.follow;

  return (
    <div className="space-y-5 pb-16">
      <div className="flex items-start gap-4">
        <Avatar src={profile.avatarUrl} name={profile.name} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold">{profile.name || `@${profile.handle}`}</h1>
          <p className="text-sm text-muted">@{profile.handle}</p>
          {profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
        </div>
        {profile.isMe ? (
          <button
            onClick={() => setEditing(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium"
          >
            <PencilIcon className="h-4 w-4" />
            {t.social.editProfile}
          </button>
        ) : (
          <button
            onClick={toggleFollow}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              profile.followState === "none"
                ? "bg-primary-600 text-white"
                : "border border-line text-ink"
            }`}
          >
            {followLabel}
          </button>
        )}
      </div>

      <div className="flex gap-6 text-sm">
        <span>
          <span className="font-display font-bold tabular-nums">{profile.posts}</span>{" "}
          <span className="text-muted">{t.social.posts}</span>
        </span>
        <span>
          <span className="font-display font-bold tabular-nums">{profile.followers}</span>{" "}
          <span className="text-muted">{t.social.followers}</span>
        </span>
        <span>
          <span className="font-display font-bold tabular-nums">{profile.following}</span>{" "}
          <span className="text-muted">{t.social.following}</span>
        </span>
      </div>

      <div className="flex gap-2 border-b border-line">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
          {t.social.tabPosts}
        </TabButton>
        {profile.isMe && (
          <TabButton active={tab === "kitchen"} onClick={() => setTab("kitchen")}>
            {t.social.tabKitchen}
          </TabButton>
        )}
      </div>

      {tab === "posts" ? (
        posts.length === 0 ? (
          <p className="text-sm text-muted">{t.social.noPosts}</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onDeleted={(id) => setPosts((ps) => ps.filter((x) => x.id !== id))} />
            ))}
          </div>
        )
      ) : (
        <KitchenStats />
      )}

      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            setProfile(p);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
        active ? "border-primary-600 text-ink" : "border-transparent text-muted"
      }`}
    >
      {children}
    </button>
  );
}

// "My kitchen" — the stats that used to live on the Dashboard, now on the
// profile, with the same deep-links into the pantry/recipes.
function KitchenStats() {
  const { t } = useI18n();
  const [items, setItems] = useState<StockItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeLite[]>([]);
  const [shopping, setShopping] = useState(0);
  const [withinDays, setWithinDays] = useState(7);
  const [trackExpiration, setTrackExpiration] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<StockItem[]>("/api/items"),
      api.get<{ trackExpiration: boolean; expiryAlertDays: number }>("/api/settings"),
      api.get<{ _id: string }[]>("/api/shopping-list").catch(() => []),
      api.get<RecipeLite[]>("/api/recipes").catch(() => []),
    ]).then(([i, s, l, r]) => {
      setItems(i);
      setTrackExpiration(s.trackExpiration);
      setWithinDays(s.expiryAlertDays ?? 7);
      setShopping(l.length);
      setRecipes(r);
    });
  }, []);

  const itemsById = useMemo(() => new Map(items.map((i) => [i._id, i])), [items]);
  const withDate = items.filter((i) => i.expirationDate);
  const expired = withDate.filter((i) => daysUntil(i.expirationDate!) < 0).length;
  const expiring = withDate.filter(
    (i) => daysUntil(i.expirationDate!) >= 0 && daysUntil(i.expirationDate!) <= withinDays,
  ).length;
  const makeable = recipes.filter((r) => canMakeRecipe(r, itemsById)).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat to="/estoque" value={items.length} label={t.dashboard.statItems} />
      {trackExpiration && <Stat to="/estoque?status=expiring" value={expiring} label={t.dashboard.statExpiring} tone="mustard" />}
      {trackExpiration && <Stat to="/estoque?status=expired" value={expired} label={t.dashboard.statExpired} tone="rust" />}
      <Stat value={shopping} label={t.dashboard.statShopping} />
      <Stat to="/receitas?canMake=1" value={makeable} label={t.dashboard.statMakeable} tone="primary" />
    </div>
  );
}

const TONES: Record<string, string> = {
  ink: "text-ink",
  primary: "text-primary-600 dark:text-primary-400",
  mustard: "text-mustard-600 dark:text-mustard-400",
  rust: "text-rust-600 dark:text-rust-400",
};

function Stat({ value, label, tone = "ink", to }: { value: number; label: string; tone?: string; to?: string }) {
  const body = (
    <>
      <p className={`font-display text-2xl font-bold tabular-nums ${TONES[tone] ?? TONES.ink}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </>
  );
  const cls = "rounded-2xl bg-surface-2 p-4";
  return to ? (
    <Link to={to} className={`${cls} transition-colors hover:bg-surface`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: ProfileView;
  onClose: () => void;
  onSaved: (p: ProfileView) => void;
}) {
  const { t } = useI18n();
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const p = await social.updateProfile({ handle, bio, isPrivate });
      onSaved(p);
    } catch (e) {
      setError((e as Error).message || "Erro");
      setSaving(false);
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-40 flex items-end bg-black/50 sm:items-center" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full space-y-3 rounded-t-3xl bg-surface p-4 pb-safe sm:mx-auto sm:max-w-sm sm:rounded-2xl sm:pb-4"
        >
          <div className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-line sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.social.editProfile}</h2>
            <button onClick={onClose} aria-label={t.common.close} className="text-muted">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              {t.social.handleLabel}
            </label>
            <div className="flex items-center rounded-xl bg-surface-2 px-3">
              <span className="text-muted">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-transparent py-2 text-base outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              {t.social.bioLabel}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.social.bioPlaceholder}
              rows={3}
              className="w-full rounded-xl bg-surface-2 px-3 py-2 text-base"
            />
          </div>
          <Switch
            checked={isPrivate}
            onChange={setIsPrivate}
            label={t.social.privateLabel}
            description={t.social.privateDesc}
          />
          {error && <p className="text-sm text-rust-600">{error}</p>}
          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? t.common.saving : t.social.save}
          </button>
        </div>
      </div>
    </Portal>
  );
}
