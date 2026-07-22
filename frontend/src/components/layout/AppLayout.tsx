import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CartIcon, MenuIcon } from "../icons";
import { ShoppingCartModal } from "../shopping/ShoppingCartModal";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menu" className="text-stone-500 dark:text-stone-400">
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-semibold">Shelf</span>
        </div>

        <button onClick={() => setCartOpen(true)} aria-label="Abrir lista de compras" className="text-stone-500 dark:text-stone-400">
          <CartIcon className="h-6 w-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ShoppingCartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
