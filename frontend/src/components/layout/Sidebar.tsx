import { NavLink } from "react-router-dom";
import { signOut, useSession } from "../../lib/auth-client";
import { CloseIcon, LogoutIcon, ShelfLogo } from "../icons";

function DashboardNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function InventoryNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="5" width="6" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="7" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RecipesNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 4v12l4-3 4 3V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 3v2M10 15v2M17 10h-2M5 10H3M15 5l-1.4 1.4M6.4 13.6 5 15M15 15l-1.4-1.4M6.4 6.4 5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const links = [
  { to: "/dashboard", label: "Dashboard", end: false, Icon: DashboardNavIcon },
  { to: "/", label: "Estoque", end: true, Icon: InventoryNavIcon },
  { to: "/receitas", label: "Receitas", end: false, Icon: RecipesNavIcon },
  { to: "/configuracoes", label: "Configurações", end: false, Icon: SettingsNavIcon },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const { data: session } = useSession();

  if (!open) return null;

  const initial = session?.user.name?.[0]?.toUpperCase() ?? session?.user.email[0]?.toUpperCase() ?? "?";

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <aside className="relative flex h-full w-64 max-w-[80vw] flex-col bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShelfLogo className="h-6 w-6" />
            <span className="font-display text-lg font-semibold">Shelf</span>
          </div>
          <button onClick={onClose} aria-label="Fechar menu" className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {session && (
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-display font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
              {initial}
            </span>
            <p className="truncate text-sm text-muted">{session.user.email}</p>
          </div>
        )}

        <nav className="mt-6 flex flex-col gap-1">
          {links.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                    : "text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "" : "text-muted"}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => signOut()}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-rust-600"
        >
          <LogoutIcon className="h-4.5 w-4.5" />
          Sair
        </button>
      </aside>
    </div>
  );
}
