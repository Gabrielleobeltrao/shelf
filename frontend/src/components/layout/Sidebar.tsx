import { Link, NavLink } from "react-router-dom";
import { signOut, useSession } from "../../lib/auth-client";
import { useI18n } from "../../lib/i18n";
import { CloseIcon, LoginIcon, LogoutIcon, ShelfLogo } from "../icons";
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

// The sidebar's inner content. Rendered both as the desktop rail and inside
// the mobile overlay. Its contents depend only on auth state, never the page.
function SidebarBody({
  variant,
  onNavigate,
  onClose,
}: {
  variant: "rail" | "overlay";
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const { data: session } = useSession();
  const { t, lang } = useI18n();

  const links = session ? appLinks : publicLinks;
  const initial =
    session?.user.name?.[0]?.toUpperCase() ?? session?.user.email[0]?.toUpperCase() ?? "?";

  // On the collapsed rail, labels are removed from layout (not just faded) so
  // each row is just its icon — centered — and only left-aligns with its label
  // once the rail is hovered open.
  const rail = variant === "rail";
  const label = rail ? "hidden whitespace-nowrap group-hover:inline" : "whitespace-nowrap";
  const rowJustify = rail ? "justify-center group-hover:justify-start" : "";

  return (
    <>
      {/* Logo only in the mobile drawer — the desktop rail drops it. */}
      {variant === "overlay" && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShelfLogo className="h-6 w-6" />
            <span className="font-display text-lg font-semibold">Shelf</span>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label={t.nav.closeMenu} className="text-muted">
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {session && (
        <div className={`mt-1 flex items-center gap-3 ${rowJustify}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-display font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
            {initial}
          </span>
          <p className={`truncate text-sm text-muted ${rail ? "hidden group-hover:block" : ""}`}>
            {session.user.email}
          </p>
        </div>
      )}

      <nav className="mt-4 flex flex-col gap-1">
        {links.map(({ to, key, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${rowJustify} ${
                isActive
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                  : "text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "" : "text-muted"}`} />
                <span className={label}>{t.nav[key]}</span>
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
            className={`flex items-center gap-3 rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-medium text-white ${rowJustify}`}
          >
            <LoginIcon className="h-4.5 w-4.5 shrink-0" />
            <span className={label}>{t.landing.enter}</span>
          </Link>
        )}

        <div>
          {/* Collapsed rail: just the language code; expands to the full toggle. */}
          {variant === "rail" && (
            <div className="flex justify-center group-hover:hidden">
              <span className="rounded-md border border-line px-2 py-1 text-xs font-semibold uppercase text-muted">
                {lang}
              </span>
            </div>
          )}
          <div className={variant === "rail" ? "hidden group-hover:block" : ""}>
            <p className="mb-1.5 whitespace-nowrap text-xs font-medium uppercase tracking-wide text-muted">
              {t.settings.language}
            </p>
            <LanguageSelect className="w-full" />
          </div>
        </div>

        {session && (
          <button
            onClick={() => signOut()}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-rust-600 ${rowJustify}`}
          >
            <LogoutIcon className="h-4.5 w-4.5 shrink-0" />
            <span className={label}>{t.nav.logout}</span>
          </button>
        )}
      </div>
    </>
  );
}

// Desktop: a collapsed icon rail that expands to full width on hover, laid
// over the content. Mobile: an overlay drawer opened by the header hamburger.
export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      <aside className="group fixed inset-y-0 left-0 z-30 hidden w-20 flex-col overflow-hidden border-r border-line bg-surface p-4 transition-[width] duration-200 ease-out hover:w-56 hover:shadow-xl lg:flex">
        <SidebarBody variant="rail" />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative flex h-full w-52 max-w-[80vw] flex-col bg-surface p-4">
            <SidebarBody variant="overlay" onNavigate={onClose} onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
