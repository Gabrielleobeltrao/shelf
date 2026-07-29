import { Link, NavLink } from "react-router-dom";
import { signOut, useSession } from "../../lib/auth-client";
import { useI18n } from "../../lib/i18n";
import { CloseIcon, LogoutIcon, ShelfLogo } from "../icons";
import { LanguageSelect } from "../ui/LanguageSelect";

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

function ExploreNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 7l-2 4-4 2 2-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function RoadmapNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 3v14M5 4h9l-2 3 2 3H5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function HomeNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3.5 9.5 10 4l6.5 5.5M5 8.2V16h4v-4h2v4h4V8.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Full app navigation — shown to signed-in users.
const appLinks = [
  { to: "/dashboard", key: "dashboard", end: false, Icon: DashboardNavIcon },
  { to: "/estoque", key: "inventory", end: true, Icon: InventoryNavIcon },
  { to: "/receitas", key: "recipes", end: false, Icon: RecipesNavIcon },
  { to: "/explorar", key: "explore", end: false, Icon: ExploreNavIcon },
  { to: "/roadmap", key: "roadmap", end: false, Icon: RoadmapNavIcon },
  { to: "/configuracoes", key: "settings", end: false, Icon: SettingsNavIcon },
] as const;

// Public pages — the only ones reachable without an account.
const publicLinks = [
  { to: "/", key: "home", end: true, Icon: HomeNavIcon },
  { to: "/explorar", key: "explore", end: false, Icon: ExploreNavIcon },
  { to: "/roadmap", key: "roadmap", end: false, Icon: RoadmapNavIcon },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

// The sidebar's inner content. Rendered both docked (desktop) and inside the
// mobile overlay. Its contents depend only on auth state, never on the page.
function SidebarBody({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const { data: session } = useSession();
  const { t } = useI18n();

  const links = session ? appLinks : publicLinks;
  const initial =
    session?.user.name?.[0]?.toUpperCase() ?? session?.user.email[0]?.toUpperCase() ?? "?";

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShelfLogo className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Shelf</span>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label={t.nav.closeMenu} className="text-muted lg:hidden">
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
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
        {links.map(({ to, key, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
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
                {t.nav[key]}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-line pt-4">
        {!session && (
          <Link
            to="/login"
            onClick={onNavigate}
            className="flex items-center justify-center rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-medium text-white"
          >
            {t.landing.enter}
          </Link>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            {t.settings.language}
          </p>
          <LanguageSelect className="w-full" />
        </div>

        {session && (
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-rust-600"
          >
            <LogoutIcon className="h-4.5 w-4.5" />
            {t.nav.logout}
          </button>
        )}
      </div>
    </>
  );
}

// Docked on desktop (always visible), overlay drawer on mobile (opened by the
// header hamburger, which is hidden from `lg` up).
export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col border-r border-line bg-surface p-4 lg:flex">
        <SidebarBody />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative flex h-full w-52 max-w-[80vw] flex-col bg-surface p-4">
            <SidebarBody onNavigate={onClose} onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
