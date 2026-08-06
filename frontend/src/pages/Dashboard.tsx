import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { daysUntil, getExpirationWarning } from "../lib/expiration";
import { hasEnoughStock } from "../lib/units";
import { normalizeName } from "../lib/text";
import { locationLabel } from "../lib/labels";
import { LOCATION_OPTIONS } from "../lib/locations";
import { describeActivity, householdApi, type ActivityEntry, type Household } from "../lib/household";
import { useHouseholdSync, useSyncEffect } from "../lib/householdSync";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { useI18n } from "../lib/i18n";
import { useSession } from "../lib/auth-client";

type Item = {
  _id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  quantity: number;
  unit: string;
  location?: string;
  expirationDate?: string;
};

type Recipe = { _id: string; ingredients: { name?: string; quantity: number; unit: string }[] };

export function Dashboard() {
  const { t, lang } = useI18n();
  const { data: session } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingCount, setShoppingCount] = useState(0);
  const [household, setHousehold] = useState<Household | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [trackExpiration, setTrackExpiration] = useState(false);
  const [withinDays, setWithinDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Item[]>("/api/items"),
      api.get<{ trackExpiration: boolean; expiryAlertDays: number }>("/api/settings"),
      api.get<{ _id: string }[]>("/api/shopping-list").catch(() => []),
      api.get<Recipe[]>("/api/recipes").catch(() => []),
      householdApi.get().catch(() => null),
      householdApi.activity().catch(() => []),
    ])
      .then(([itemsData, settings, list, recipesData, hh, act]) => {
        setItems(itemsData);
        setTrackExpiration(settings.trackExpiration);
        setWithinDays(settings.expiryAlertDays ?? 7);
        setShoppingCount(list.length);
        setRecipes(recipesData);
        setHousehold(hh);
        setActivity(act);
      })
      .finally(() => setLoading(false));
  }, []);

  const { itemsRev, listRev } = useHouseholdSync();
  useSyncEffect(itemsRev, () => {
    api.get<Item[]>("/api/items").then(setItems).catch(() => {});
    householdApi.activity().then(setActivity).catch(() => {});
  });
  useSyncEffect(listRev, () => {
    api.get<{ _id: string }[]>("/api/shopping-list").then((l) => setShoppingCount(l.length)).catch(() => {});
    householdApi.activity().then(setActivity).catch(() => {});
  });

  const withDate = items.filter((i) => i.expirationDate);
  const expired = withDate.filter((i) => daysUntil(i.expirationDate!) < 0);
  const expiringSoon = withDate
    .filter((i) => daysUntil(i.expirationDate!) >= 0 && daysUntil(i.expirationDate!) <= withinDays)
    .sort((a, b) => daysUntil(a.expirationDate!) - daysUntil(b.expirationDate!));
  const attention = [...expired, ...expiringSoon];

  // How many recipes can be made right now, matching ingredients to the
  // pantry by name (robust across personal/shared spaces).
  const stockByName = new Map(items.map((i) => [normalizeName(i.name), i]));
  const makeableCount = recipes.filter(
    (r) =>
      r.ingredients.length > 0 &&
      r.ingredients.every((ing) => {
        if (!ing.name?.trim()) return false;
        const stock = stockByName.get(normalizeName(ing.name));
        return !!stock && hasEnoughStock(ing.quantity, ing.unit, stock.quantity, stock.unit) !== false;
      }),
  ).length;

  const locationCounts = [
    ...LOCATION_OPTIONS.map((loc) => ({
      label: locationLabel(t, loc),
      count: items.filter((i) => i.location === loc).length,
    })),
    { label: t.dashboard.noLocation, count: items.filter((i) => !i.location).length },
  ].filter((l) => l.count > 0);

  const locale = lang === "pt" ? "pt-BR" : "en-US";

  const firstName = session?.user.name?.trim().split(" ")[0] ?? "";
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t.dashboard.greetMorning(firstName)
      : hour < 18
        ? t.dashboard.greetAfternoon(firstName)
        : t.dashboard.greetEvening(firstName);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold">{greeting}</h1>
        {household && (
          <p className="text-sm text-muted">
            {household.isHome
              ? t.dashboard.yourSpace
              : t.dashboard.sharedIn(household.name, household.members.length)}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat to="/estoque" value={items.length} label={t.dashboard.statItems} />
            {trackExpiration && (
              <Stat value={expiringSoon.length} label={t.dashboard.statExpiring} tone="mustard" />
            )}
            {trackExpiration && (
              <Stat value={expired.length} label={t.dashboard.statExpired} tone="rust" />
            )}
            <Stat value={shoppingCount} label={t.dashboard.statShopping} />
            <Stat to="/receitas" value={makeableCount} label={t.dashboard.statMakeable} tone="primary" />
          </div>

          {/* Breakdown by location */}
          {locationCounts.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted">{t.dashboard.byLocation}</h2>
              <div className="flex flex-wrap gap-2">
                {locationCounts.map((l) => (
                  <span
                    key={l.label}
                    className="rounded-full bg-surface-2 px-3 py-1 text-sm text-muted"
                  >
                    {l.label} <span className="font-semibold text-ink tabular-nums">{l.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expiring / expired */}
          <div>
            <h2 className="mb-2 text-sm font-medium text-muted">{t.dashboard.expiringSoon}</h2>
            {!trackExpiration ? (
              <p className="text-sm text-muted">
                {t.dashboard.enablePrefix}{" "}
                <Link to="/configuracoes" className="text-primary-600 underline">
                  {t.dashboard.settingsLink}
                </Link>{" "}
                {t.dashboard.enableSuffix}
              </p>
            ) : attention.length === 0 ? (
              <p className="text-sm text-muted">{t.dashboard.none}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {attention.map((item) => {
                  const isExpired = daysUntil(item.expirationDate!) < 0;
                  return (
                    <li key={item._id} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                      <PhotoOrFallback
                        src={item.imageUrl}
                        imgClassName="h-11 w-11 shrink-0 rounded-xl object-cover"
                        fallback={<div className="h-11 w-11 shrink-0 rounded-xl bg-surface" />}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        {item.brand && <p className="truncate text-xs text-muted">{item.brand}</p>}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isExpired
                            ? "bg-rust-100 text-rust-700 dark:bg-rust-900/40 dark:text-rust-400"
                            : "bg-mustard-100 text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400"
                        }`}
                      >
                        {getExpirationWarning(t, item.expirationDate, withinDays)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Recent household activity */}
          {activity.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted">{t.dashboard.recentActivity}</h2>
              <ul className="space-y-1.5">
                {activity.slice(0, 6).map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-muted">{describeActivity(t, e)}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {new Date(e.at).toLocaleDateString(locale, { day: "2-digit", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TONES: Record<string, string> = {
  ink: "text-ink",
  primary: "text-primary-600 dark:text-primary-400",
  mustard: "text-mustard-600 dark:text-mustard-400",
  rust: "text-rust-600 dark:text-rust-400",
};

function Stat({
  value,
  label,
  tone = "ink",
  to,
}: {
  value: number;
  label: string;
  tone?: keyof typeof TONES | string;
  to?: string;
}) {
  const body = (
    <>
      <p className={`font-display text-2xl font-bold tabular-nums ${TONES[tone] ?? TONES.ink}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </>
  );
  const className = "rounded-2xl bg-surface-2 p-4";
  return to ? (
    <Link to={to} className={`${className} transition-colors hover:bg-surface`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
