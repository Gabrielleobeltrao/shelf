import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CartIcon, ShelfLogo } from "../icons";
import { useSession } from "../../lib/auth-client";
import { useI18n } from "../../lib/i18n";
import { api } from "../../lib/api";
import { daysUntil } from "../../lib/expiration";
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

  const [items, setItems] = useState<AlertItem[]>([]);
  const [trackExpiration, setTrackExpiration] = useState(false);
  const [withinDays, setWithinDays] = useState(7);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

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
  }, [loggedIn, pathname]);

  const alerts = trackExpiration
    ? items
        .filter((i) => i.expirationDate && daysUntil(i.expirationDate) <= withinDays)
        .sort((a, b) => daysUntil(a.expirationDate!) - daysUntil(b.expirationDate!))
    : [];

  const actions = loggedIn && (
    <>
      <NotificationsBell count={alerts.length} onClick={() => setAlertsOpen(true)} />
      <button onClick={() => setCartOpen(true)} aria-label={t.nav.openCart} className="text-muted">
        <CartIcon className="h-6 w-6" />
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar. */}
      <header className="grid grid-cols-3 items-center border-b border-line bg-surface px-4 py-3 sm:px-6 lg:hidden">
        <div className="justify-self-start">{left}</div>

        <Link to="/" className="flex items-center justify-self-center gap-2">
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
        <div className="hidden items-center justify-end gap-4 border-b border-line bg-surface px-8 py-3 lg:flex">
          {actions}
        </div>
      )}

      {loggedIn && (
        <>
          <NotificationsPanel
            open={alertsOpen}
            onClose={() => setAlertsOpen(false)}
            items={alerts}
            trackExpiration={trackExpiration}
            withinDays={withinDays}
          />
          <ShoppingCartModal open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
      )}
    </>
  );
}
