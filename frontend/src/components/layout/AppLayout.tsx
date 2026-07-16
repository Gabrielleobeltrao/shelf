import { Outlet } from "react-router-dom";
import { signOut, useSession } from "../../lib/auth-client";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <span className="text-lg font-semibold">Shelf</span>
        {session && (
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Sair
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
