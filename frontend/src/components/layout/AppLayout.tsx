import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CartIcon, MenuIcon, ShelfLogo } from "../icons";
import { ShoppingCartModal } from "../shopping/ShoppingCartModal";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="flex min-h-svh w-full flex-col">
      <header className="grid grid-cols-3 items-center border-b border-line px-4 py-3 sm:px-6 lg:px-8">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
          className="justify-self-start text-muted"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-self-center gap-2">
          <ShelfLogo className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Shelf</span>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          aria-label="Abrir lista de compras"
          className="justify-self-end text-muted"
        >
          <CartIcon className="h-6 w-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ShoppingCartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
