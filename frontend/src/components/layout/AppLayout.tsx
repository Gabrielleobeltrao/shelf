import { useState } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
          className="text-xl leading-none"
        >
          ☰
        </button>
        <span className="text-lg font-semibold">Shelf</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <Outlet />
      </main>

      <BottomNav />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}
