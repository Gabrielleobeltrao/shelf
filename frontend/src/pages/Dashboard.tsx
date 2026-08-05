import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { daysUntil, getExpirationWarning } from "../lib/expiration";
import { useHouseholdSync, useSyncEffect } from "../lib/householdSync";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { useI18n } from "../lib/i18n";

type Item = {
  _id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  expirationDate?: string;
};

export function Dashboard() {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [trackExpiration, setTrackExpiration] = useState(false);
  const [withinDays, setWithinDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Item[]>("/api/items"),
      api.get<{ trackExpiration: boolean; expiryAlertDays: number }>("/api/settings"),
    ])
      .then(([itemsData, settings]) => {
        setItems(itemsData);
        setTrackExpiration(settings.trackExpiration);
        setWithinDays(settings.expiryAlertDays ?? 7);
      })
      .finally(() => setLoading(false));
  }, []);

  const { itemsRev } = useHouseholdSync();
  useSyncEffect(itemsRev, () => {
    api.get<Item[]>("/api/items").then(setItems).catch(() => {});
  });

  const expiringSoon = items
    .filter((item) => item.expirationDate)
    .filter((item) => daysUntil(item.expirationDate!) <= withinDays)
    .sort((a, b) => daysUntil(a.expirationDate!) - daysUntil(b.expirationDate!));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{t.dashboard.title}</h1>

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
        ) : loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : expiringSoon.length === 0 ? (
          <p className="text-sm text-muted">{t.dashboard.none}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {expiringSoon.map((item) => (
              <li key={item._id} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                <PhotoOrFallback
                  src={item.imageUrl}
                  imgClassName="h-10 w-10 shrink-0 rounded-lg object-cover"
                  fallback={<div className="h-10 w-10 shrink-0 rounded-lg bg-surface" />}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{item.name}</p>
                  {item.brand && <p className="truncate text-xs text-muted">{item.brand}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-rust-100 px-2 py-0.5 text-xs font-medium text-rust-700 dark:bg-rust-900/40 dark:text-rust-400">
                  {getExpirationWarning(t, item.expirationDate, withinDays)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
