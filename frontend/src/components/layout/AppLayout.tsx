import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CartIcon, MenuIcon, ShelfLogo } from "../icons";
import { ShoppingCartModal } from "../shopping/ShoppingCartModal";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <ShelfLogo className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Shelf</span>
        </div>

        <div className="flex items-center gap-3 text-muted">
          <button onClick={() => setCartOpen(true)} aria-label="Abrir lista de compras">
            <CartIcon className="h-6 w-6" />
          </button>
          <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ShoppingCartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
