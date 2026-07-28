import { Link } from "react-router-dom";
import {
  BarcodeIcon,
  BookmarkIcon,
  CartIcon,
  ExploreIcon,
  ShelfLogo,
  StarIcon,
} from "../components/icons";
import { BowlIllustration, PantryShelfIllustration } from "../components/illustrations";

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
  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <ShelfLogo className="h-7 w-7" />
          <span className="font-display text-xl font-semibold">Shelf</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/explorar"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted sm:block"
          >
            Explorar
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:pt-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
                Descubra, compartilhe e organize suas receitas
              </h1>
              <p className="mt-4 max-w-md text-base text-muted sm:text-lg">
                Uma comunidade pra encontrar receitas de outras pessoas, avaliar, comentar e
                salvar as suas favoritas — e ainda manter a cozinha organizada.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white"
                >
                  Criar conta grátis
                </Link>
                <Link
                  to="/explorar"
                  className="flex items-center gap-2 rounded-lg bg-surface-2 px-5 py-2.5 font-medium text-primary-600"
                >
                  <ExploreIcon className="h-4 w-4" />
                  Explorar receitas
                </Link>
              </div>
            </div>

            {/* Card de prévia */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex h-40 items-center justify-center rounded-xl bg-mustard-100 dark:bg-mustard-900/30">
                <BowlIllustration className="h-24 w-auto" />
              </div>
              <div className="mt-3 space-y-1">
                <h3 className="font-display text-lg font-semibold">Bolo de cenoura</h3>
                <p className="text-sm text-muted">por Marina Costa</p>
                <div className="flex items-center gap-2 pt-1">
                  <StarRow />
                  <span className="text-sm font-medium tabular-nums">5.0</span>
                  <span className="text-sm text-muted">· 12 comentários</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comunidade */}
        <section className="border-y border-line bg-surface py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Uma comunidade de quem gosta de cozinhar
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Explore receitas compartilhadas por outras pessoas e interaja com elas.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<ExploreIcon className="h-5 w-5" />}
                title="Explorar e buscar"
                text="Encontre receitas por nome ou categoria, feitas por toda a comunidade."
              />
              <FeatureCard
                icon={<StarIcon className="h-5 w-5" filled />}
                title="Avaliar e comentar"
                text="Dê de 1 a 6 estrelas e deixe seu comentário nas receitas que testar."
              />
              <FeatureCard
                icon={<BookmarkIcon className="h-5 w-5" filled />}
                title="Salvar favoritas"
                text="Guarde as receitas que gostou pra encontrar rapidinho na sua lista."
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
                E a sua cozinha, sempre organizada
              </h2>
              <p className="mt-2 max-w-md text-muted">
                Além das receitas, o Shelf te ajuda a controlar o que tem em casa.
              </p>
              <ul className="mt-6 space-y-4">
                <FeatureRow
                  icon={<BarcodeIcon className="h-5 w-5" />}
                  title="Estoque com código de barras"
                  text="Escaneie os produtos e acompanhe quantidades e validades."
                />
                <FeatureRow
                  icon={<CartIcon className="h-5 w-5" />}
                  title="Lista de compras"
                  text="Marque o que precisa comprar e atualize o estoque ao voltar do mercado."
                />
              </ul>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-line bg-surface py-14">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Comece a cozinhar com o Shelf
            </h2>
            <p className="mt-2 text-muted">É grátis. Crie sua conta em segundos.</p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-3 font-medium text-white"
            >
              Criar conta grátis
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
          Explorar receitas
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
