import { useNavigate } from "react-router-dom";
import { BackIcon, CheckIcon } from "../components/icons";
import { BowlIllustration } from "../components/illustrations";
import { Header } from "../components/layout/Header";
import { useI18n } from "../lib/i18n";

export function Roadmap() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const r = t.roadmap;

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col">
      <Header
        left={
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            aria-label={t.common.back}
            className="text-muted"
          >
            <BackIcon className="h-6 w-6" />
          </button>
        }
      />

      <main className="flex-1 space-y-6 px-4 py-4">
        {/* Capa da "receita" */}
        <div>
          <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-mustard-100 dark:bg-mustard-900/30">
            <BowlIllustration className="h-24 w-auto" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">{r.title}</h1>
          <p className="mt-1 text-sm text-muted">{r.subtitle}</p>
        </div>

        {/* Ingredientes = features prontas */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{r.ingredientsTitle}</p>
          <p className="mb-3 text-sm text-muted">{r.ingredientsHint}</p>
          <ul className="space-y-2.5">
            {r.ingredients.map((feature) => (
              <li key={feature.name} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{feature.name}</p>
                  <p className="text-sm text-muted">{feature.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Modo de preparo = próximas features */}
        <section className="border-t border-line pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{r.methodTitle}</p>
          <p className="mb-3 text-sm text-muted">{r.methodHint}</p>
          <ol className="space-y-3">
            {r.method.map((step, index) => (
              <li key={step.name} className="flex items-start gap-3 rounded-xl bg-surface-2 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mustard-100 text-xs font-semibold tabular-nums text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-sm text-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
