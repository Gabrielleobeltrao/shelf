import { Link } from "react-router-dom";
import { ShelfLogo } from "../icons";
import { useI18n } from "../../lib/i18n";
import { LanguageSelect } from "../ui/LanguageSelect";

const YEAR = new Date().getFullYear();

const linkClass = "text-ink transition-colors hover:text-primary-600";

// Shared site footer with links to the public pages of the app.
export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2">
          <Link to="/" className="flex w-fit items-center gap-2">
            <ShelfLogo className="h-6 w-6" />
            <span className="font-display text-lg font-semibold">Shelf</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">{t.footer.tagline}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            {t.footer.navigation}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className={linkClass}>
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link to="/explorar" className={linkClass}>
                {t.nav.explore}
              </Link>
            </li>
            <li>
              <Link to="/roadmap" className={linkClass}>
                {t.nav.roadmap}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            {t.footer.account}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/login" className={linkClass}>
                {t.auth.signin}
              </Link>
            </li>
            <li>
              <Link to="/login?signup=1" className={linkClass}>
                {t.auth.signup}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted sm:flex-row sm:px-6 lg:px-8">
          <p>© {YEAR} Shelf · {t.footer.rights}</p>
          <LanguageSelect />
        </div>
      </div>
    </footer>
  );
}
