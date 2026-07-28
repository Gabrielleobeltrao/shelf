import { useNavigate } from "react-router-dom";
import { BackIcon, CheckIcon } from "../components/icons";
import { BowlIllustration } from "../components/illustrations";
import { Header } from "../components/layout/Header";
import { useI18n } from "../lib/i18n";

// Rotating header tints so the grid reads like a varied menu of dishes.
const TINTS = [
  "bg-mustard-100 dark:bg-mustard-900/30",
  "bg-primary-100 dark:bg-primary-900/30",
  "bg-rust-100 dark:bg-rust-900/30",
];

type FeatureCardProps = {
  name: string;
  desc: string;
  done: boolean;
  status: string;
  tint: string;
};

function FeatureCard({ name, desc, done, status, tint }: FeatureCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-line">
      <div className={`relative flex h-24 items-center justify-center ${tint} ${done ? "opacity-60" : ""}`}>
        <BowlIllustration className="h-14 w-auto" />
        <span
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            done ? "bg-primary-600 text-white" : "bg-on-photo text-ink"
          }`}
        >
          {done && <CheckIcon className="h-3 w-3" />}
          {status}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <h3 className={`font-medium ${done ? "text-muted line-through decoration-2" : ""}`}>{name}</h3>
        <p className="text-sm text-muted">{desc}</p>
      </div>
    </article>
  );
}

export function Roadmap() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const r = t.roadmap;

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col">
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

      <main className="flex-1 space-y-8 px-4 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">{r.title}</h1>
          <p className="mt-1 text-sm text-muted">{r.subtitle}</p>
        </div>

        {/* Já feitas — riscadas */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{r.doneTitle}</p>
          <p className="mb-3 text-sm text-muted">{r.doneHint}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {r.done.map((feature, index) => (
              <FeatureCard
                key={feature.name}
                name={feature.name}
                desc={feature.desc}
                done
                status={r.statusDone}
                tint={TINTS[index % TINTS.length]}
              />
            ))}
          </div>
        </section>

        {/* Próximas — no forno */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{r.plannedTitle}</p>
          <p className="mb-3 text-sm text-muted">{r.plannedHint}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {r.planned.map((feature, index) => (
              <FeatureCard
                key={feature.name}
                name={feature.name}
                desc={feature.desc}
                done={false}
                status={r.statusPlanned}
                tint={TINTS[index % TINTS.length]}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
