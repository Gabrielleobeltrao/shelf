import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CartIcon, MenuIcon } from "../icons";
import { ShoppingCartModal } from "../shopping/ShoppingCartModal";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useI18n } from "../../lib/i18n";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="flex min-h-svh w-full flex-col lg:pl-16">
      <Header
        left={
          <button onClick={() => setSidebarOpen(true)} aria-label={t.nav.openMenu} className="text-muted lg:hidden">
            <MenuIcon className="h-6 w-6" />
          </button>
        }
        right={
          <button onClick={() => setCartOpen(true)} aria-label={t.nav.openCart} className="text-muted">
            <CartIcon className="h-6 w-6" />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ShoppingCartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
