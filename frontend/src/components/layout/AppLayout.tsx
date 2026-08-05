import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CartIcon, MenuIcon } from "../icons";
import { ShoppingCartModal } from "../shopping/ShoppingCartModal";
import { NotificationsBell } from "../notifications/NotificationsBell";
import { NotificationsPanel, type AlertItem } from "../notifications/NotificationsPanel";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useI18n } from "../../lib/i18n";
import { api } from "../../lib/api";
import { daysUntil } from "../../lib/expiration";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [items, setItems] = useState<AlertItem[]>([]);
  const [trackExpiration, setTrackExpiration] = useState(false);
  const [withinDays, setWithinDays] = useState(7);
  const { t } = useI18n();
  const { pathname } = useLocation();

  // Refetch on navigation so the badge reflects item edits, purchases and
  // threshold changes made on other pages without a full reload.
  useEffect(() => {
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
  }, [pathname]);

  const alerts = trackExpiration
    ? items
        .filter((i) => i.expirationDate && daysUntil(i.expirationDate) <= withinDays)
        .sort((a, b) => daysUntil(a.expirationDate!) - daysUntil(b.expirationDate!))
    : [];

  return (
    <div className="flex min-h-svh w-full flex-col lg:pl-20">
      {/* Mobile top bar. */}
      <Header
        left={
          <button onClick={() => setSidebarOpen(true)} aria-label={t.nav.openMenu} className="text-muted lg:hidden">
            <MenuIcon className="h-6 w-6" />
          </button>
        }
        right={
          <div className="flex items-center gap-4">
            <NotificationsBell count={alerts.length} onClick={() => setAlertsOpen(true)} />
            <button onClick={() => setCartOpen(true)} aria-label={t.nav.openCart} className="text-muted">
              <CartIcon className="h-6 w-6" />
            </button>
          </div>
        }
      />

      {/* Desktop top bar — notifications live here, not in the sidebar. */}
      <div className="hidden items-center justify-end border-b border-line px-8 py-3 lg:flex">
        <NotificationsBell count={alerts.length} onClick={() => setAlertsOpen(true)} />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
        <Outlet context={{ openCart: () => setCartOpen(true) }} />
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ShoppingCartModal open={cartOpen} onClose={() => setCartOpen(false)} />
      <NotificationsPanel
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        items={alerts}
        trackExpiration={trackExpiration}
        withinDays={withinDays}
      />
    </div>
  );
}
