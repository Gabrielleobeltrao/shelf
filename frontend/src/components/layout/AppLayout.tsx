import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CartIcon } from "../icons";
import { ShoppingCartModal } from "../shopping/ShoppingCartModal";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="text-xl leading-none"
          >
            ☰
          </button>
          <span className="text-lg font-semibold">Shelf</span>
        </div>

        <button onClick={() => setCartOpen(true)} aria-label="Abrir lista de compras">
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
