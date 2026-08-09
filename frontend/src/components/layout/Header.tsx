import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CartIcon, ShelfLogo } from "../icons";
import { useSession } from "../../lib/auth-client";
import { useI18n } from "../../lib/i18n";
import { api } from "../../lib/api";
import { social, type NotificationView } from "../../lib/social";
import { daysUntil } from "../../lib/expiration";
import { useHouseholdSync } from "../../lib/householdSync";
import { NotificationsBell } from "../notifications/NotificationsBell";
import { NotificationsPanel, type AlertItem } from "../notifications/NotificationsPanel";
import { ShoppingCartModal } from "../shopping/ShoppingCartModal";

type Props = {
  left?: ReactNode;
  right?: ReactNode;
};

// The app header. On mobile it's the top bar (logo + page actions); on desktop
// the docked sidebar handles nav, so the header collapses to a thin top strip
// that only appears when signed in — to hold the global actions (notifications
// and the shopping list). Pages inject their own left/right; the bell and cart
// are added here so every signed-in page shows the same header.
export function Header({ left, right }: Props) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const loggedIn = !!session;
  const { pathname } = useLocation();
  const { itemsRev, listRev } = useHouseholdSync();

  const [items, setItems] = useState<AlertItem[]>([]);
  const [trackExpiration, setTrackExpiration] = useState(false);
  const [withinDays, setWithinDays] = useState(7);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [socialItems, setSocialItems] = useState<NotificationView[]>([]);
  const [socialUnread, setSocialUnread] = useState(0);
  // Dismissed alerts (per device), keyed by item + its expiration date so a
  // re-expiring item (date changed) surfaces again.
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem("shelf.dismissedAlerts") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  // Refetch on navigation so the badge reflects item edits, purchases and
  // threshold changes without a full reload.
  useEffect(() => {
    if (!loggedIn) {
      setItems([]);
      return;
    }
    Promise.all([
      api.get<AlertItem[]>("/api/items"),
      api.get<{ trackExpiration: boolean; expiryAlertDays: number }>("/api/settings"),
    ])
      .then(([itemsData, settings]) => {
        setItems(itemsData);
        setTrackExpiration(settings.trackExpiration);
        setWithinDays(settings.expiryAlertDays ?? 7);
      })
      .catch(() => {});
  }, [loggedIn, pathname, itemsRev]);

  // Cart badge — count of items in the shopping list, kept live via listRev.
  useEffect(() => {
    if (!loggedIn) {
      setCartCount(0);
      return;
    }
    api
      .get<{ _id: string }[]>("/api/shopping-list")
      .then((l) => setCartCount(l.length))
      .catch(() => {});
  }, [loggedIn, pathname, listRev]);

  // Social notifications share the same bell — badge sums both, panel lists them.
  useEffect(() => {
    if (!loggedIn) {
      setSocialItems([]);
      setSocialUnread(0);
      return;
    }
    social
      .notifications()
      .then((r) => {
        setSocialItems(r.items);
        setSocialUnread(r.unread);
      })
      .catch(() => {});
  }, [loggedIn, pathname]);

  // Opening the bell marks social notifications read (optimistically).
  function openAlerts() {
    setAlertsOpen(true);
    if (socialUnread > 0) {
      setSocialUnread(0);
      setSocialItems((xs) => xs.map((n) => ({ ...n, read: true })));
      social.markNotificationsRead().catch(() => {});
    }
  }

  const alerts = trackExpiration
    ? items
        .filter((i) => i.expirationDate && daysUntil(i.expirationDate) <= withinDays)
        .sort((a, b) => daysUntil(a.expirationDate!) - daysUntil(b.expirationDate!))
    : [];

  const alertKey = (i: AlertItem) => `${i._id}:${i.expirationDate}`;
  const visibleAlerts = alerts.filter((a) => !dismissed.has(alertKey(a)));

  // Persist, pruning stale keys (items no longer alerting) so it stays bounded.
  function persistDismissed(next: Set<string>) {
    const alertKeys = new Set(alerts.map(alertKey));
    const pruned = new Set([...next].filter((k) => alertKeys.has(k)));
    try {
      localStorage.setItem("shelf.dismissedAlerts", JSON.stringify([...pruned]));
    } catch {
      // ignore storage failures
    }
    setDismissed(pruned);
  }
  const dismissAlert = (i: AlertItem) => persistDismissed(new Set(dismissed).add(alertKey(i)));
  const clearAlerts = () =>
    persistDismissed(new Set([...dismissed, ...visibleAlerts.map(alertKey)]));

  const actions = loggedIn && (
    <>
      <NotificationsBell count={visibleAlerts.length + socialUnread} onClick={openAlerts} />
      <button onClick={() => setCartOpen(true)} aria-label={t.nav.openCart} className="relative text-muted">
        <CartIcon className="h-6 w-6" />
        {cartCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[0.6rem] font-semibold leading-none text-white">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar. */}
      <header className="sticky top-0 z-20 grid grid-cols-3 items-center border-b border-line bg-surface px-4 py-3 sm:px-6 lg:hidden">
        <div className="justify-self-start">{left}</div>

        <Link
          to={loggedIn ? "/feed" : "/"}
          className="flex items-center justify-self-center gap-2"
        >
          <ShelfLogo className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Shelf</span>
        </Link>

        <div className="flex items-center gap-4 justify-self-end">
          {actions}
          {right}
        </div>
      </header>

      {/* Desktop top strip — only when signed in; global actions live here. */}
      {loggedIn && (
        <div className="sticky top-0 z-20 hidden items-center justify-end gap-4 border-b border-line bg-surface px-8 py-3 lg:flex">
          {actions}
        </div>
      )}

      {loggedIn && (
        <>
          <NotificationsPanel
            open={alertsOpen}
            onClose={() => setAlertsOpen(false)}
            items={visibleAlerts}
            social={socialItems}
            trackExpiration={trackExpiration}
            withinDays={withinDays}
            onDismiss={dismissAlert}
            onClearAll={clearAlerts}
            onRemoved={(item) => setItems((prev) => prev.filter((i) => i._id !== item._id))}
          />
          <ShoppingCartModal
            open={cartOpen}
            onClose={() => {
              setCartOpen(false);
              api
                .get<{ _id: string }[]>("/api/shopping-list")
                .then((l) => setCartCount(l.length))
                .catch(() => {});
            }}
          />
        </>
      )}
    </>
  );
}
