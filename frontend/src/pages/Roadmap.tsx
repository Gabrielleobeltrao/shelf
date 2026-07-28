import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { BackIcon, BarcodeIcon, CartIcon, CheckIcon, ExploreIcon, StarIcon } from "../components/icons";
import { Header } from "../components/layout/Header";
import { useI18n } from "../lib/i18n";

type IconProps = { className?: string };

// Roadmap-specific line icons, drawn in the app's 20x20 / stroke-1.5 style
// so each feature gets its own recognizable glyph instead of one repeated
// illustration.
function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 16.5S3.5 12.5 3.5 7.8A3.3 3.3 0 0 1 10 6a3.3 3.3 0 0 1 6.5 1.8c0 4.7-6.5 8.7-6.5 8.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5 15c0-6 5-9.5 11-9.5 0 6-3.5 10-9 10a3 3 0 0 1-2-.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 14.5C8.5 11 11 9 14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 6C8.5 5 5.8 4.6 4 5v10c1.8-.4 4.5 0 6 1 1.5-1 4.2-1.4 6-1V5c-1.8-.4-4.5 0-6 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 6v10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="6" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.8 9l4.4-2.5M7.8 11l4.4 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h14M10 3c2.2 2 2.2 12 0 14M10 3c-2.2 2-2.2 12 0 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LightbulbIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7 12.5a4 4 0 1 1 6 0c-.7.6-1 1.2-1 2H8c0-.8-.3-1.4-1-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 17h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 8.5a4 4 0 0 1 8 0c0 3.5 1.3 4.8 1.3 4.8H4.7S6 12 6 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 15.5a1.6 1.6 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M8.5 11.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 9.5L6 11a2.5 2.5 0 0 0 3.5 3.5L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 10.5L14 9a2.5 2.5 0 0 0-3.5-3.5L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 4v8M6.5 9L10 12.5 13.5 9M5 15.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Rotating header tints so the grid reads like a varied menu of dishes.
const TINTS = [
  { bg: "bg-mustard-100 dark:bg-mustard-900/30", fg: "text-mustard-700 dark:text-mustard-400" },
  { bg: "bg-primary-100 dark:bg-primary-900/30", fg: "text-primary-700 dark:text-primary-400" },
  { bg: "bg-rust-100 dark:bg-rust-900/30", fg: "text-rust-700 dark:text-rust-400" },
];

// Icons parallel to t.roadmap.done / t.roadmap.planned (same order, both langs).
const DONE_ICONS: ComponentType<IconProps>[] = [
  BarcodeIcon, CalendarIcon, HeartIcon, LeafIcon, CartIcon,
  BookIcon, ShareIcon, StarIcon, ExploreIcon, GridIcon, GlobeIcon,
];
const PLANNED_ICONS: ComponentType<IconProps>[] = [
  CalendarIcon, LightbulbIcon, ShareIcon, BellIcon, LinkIcon, DownloadIcon,
];

type FeatureCardProps = {
  name: string;
  desc: string;
  done: boolean;
  status: string;
  Icon: ComponentType<IconProps>;
  tint: (typeof TINTS)[number];
};

function FeatureCard({ name, desc, done, status, Icon, tint }: FeatureCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-line">
      <div className={`relative flex h-24 items-center justify-center ${tint.bg} ${done ? "opacity-60" : ""}`}>
        <Icon className={`h-9 w-9 ${tint.fg}`} />
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
                Icon={PLANNED_ICONS[index % PLANNED_ICONS.length]}
                tint={TINTS[index % TINTS.length]}
              />
            ))}
          </div>
        </section>

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
                Icon={DONE_ICONS[index % DONE_ICONS.length]}
                tint={TINTS[index % TINTS.length]}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
