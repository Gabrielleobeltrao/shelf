import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarcodeIcon,
  BookmarkIcon,
  CartIcon,
  ExploreIcon,
  LoginIcon,
  MenuIcon,
  ShelfLogo,
  StarIcon,
} from "../components/icons";
import { BowlIllustration, PantryShelfIllustration } from "../components/illustrations";
import { useI18n } from "../lib/i18n";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";

function StarRow() {
  return (
    <div className="flex gap-0.5 text-mustard-500">
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <StarIcon key={s} className="h-4 w-4" filled />
      ))}
    </div>
  );
}

export function Landing() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-bg lg:pl-20">
      <Header
        left={
          <button type="button" onClick={() => setMenuOpen(true)} aria-label={t.nav.openMenu} className="text-muted lg:hidden">
            <MenuIcon className="h-6 w-6" />
          </button>
        }
        right={
          <Link to="/login" aria-label={t.landing.enter} className="text-muted">
            <LoginIcon className="h-6 w-6" />
          </Link>
        }
      />

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:pt-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                {t.landing.heroTitle}
              </h1>
              <p className="mt-4 max-w-md text-base text-muted sm:text-lg">
                {t.landing.heroSubtitle}
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  to="/login?signup=1"
                  className="flex flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white sm:flex-none sm:px-5 sm:text-base"
                >
                  {t.landing.createFree}
                </Link>
                <Link
                  to="/explorar"
                  className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-primary-600 sm:flex-none sm:px-5 sm:text-base"
                >
                  <ExploreIcon className="h-4 w-4 shrink-0" />
                  {t.landing.exploreRecipes}
                </Link>
              </div>
            </div>

            {/* Card de prévia */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex h-40 items-center justify-center rounded-xl bg-mustard-100 dark:bg-mustard-900/30">
                <BowlIllustration className="h-24 w-auto" />
              </div>
              <div className="mt-3 space-y-1">
                <h3 className="font-display text-lg font-semibold">{t.landing.previewName}</h3>
                <p className="text-sm text-muted">{t.landing.previewAuthor}</p>
                <div className="flex items-center gap-2 pt-1">
                  <StarRow />
                  <span className="text-sm font-medium tabular-nums">5.0</span>
                  <span className="text-sm text-muted">· {t.landing.previewComments}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comunidade */}
        <section className="border-y border-line bg-surface py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {t.landing.communityTitle}
            </h2>
            <p className="mt-2 max-w-xl text-muted">{t.landing.communitySubtitle}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<ExploreIcon className="h-5 w-5" />}
                title={t.landing.featExploreTitle}
                text={t.landing.featExploreText}
              />
              <FeatureCard
                icon={<StarIcon className="h-5 w-5" filled />}
                title={t.landing.featRateTitle}
                text={t.landing.featRateText}
              />
              <FeatureCard
                icon={<BookmarkIcon className="h-5 w-5" filled />}
                title={t.landing.featSaveTitle}
                text={t.landing.featSaveText}
              />
            </div>
          </div>
        </section>

        {/* Organização */}
        <section className="py-14">
          <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 lg:grid-cols-2">
            <div className="order-2 flex justify-center lg:order-1">
              <PantryShelfIllustration className="h-40 w-auto" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                {t.landing.kitchenTitle}
              </h2>
              <p className="mt-2 max-w-md text-muted">{t.landing.kitchenSubtitle}</p>
              <ul className="mt-6 space-y-4">
                <FeatureRow
                  icon={<BarcodeIcon className="h-5 w-5" />}
                  title={t.landing.kitchenStockTitle}
                  text={t.landing.kitchenStockText}
                />
                <FeatureRow
                  icon={<CartIcon className="h-5 w-5" />}
                  title={t.landing.kitchenCartTitle}
                  text={t.landing.kitchenCartText}
                />
              </ul>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-line bg-surface py-14">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {t.landing.ctaTitle}
            </h2>
            <p className="mt-2 text-muted">{t.landing.ctaSubtitle}</p>
            <Link
              to="/login?signup=1"
              className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-3 font-medium text-white"
            >
              {t.landing.createFree}
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 text-sm text-muted">
        <div className="flex items-center gap-2">
          <ShelfLogo className="h-5 w-5" />
          <span className="font-display font-semibold">Shelf</span>
        </div>
        <Link to="/explorar" className="font-medium text-primary-600">
          {t.landing.exploreRecipes}
        </Link>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
        {icon}
      </span>
      <h3 className="mt-3 font-display font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}

function FeatureRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
        {icon}
      </span>
      <div>
        <h3 className="font-display font-semibold">{title}</h3>
        <p className="mt-0.5 text-sm text-muted">{text}</p>
      </div>
    </li>
  );
}
