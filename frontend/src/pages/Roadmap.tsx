import { useEffect, useState, type ComponentType } from "react";
import { BarcodeIcon, CartIcon, CheckIcon, ExploreIcon, MenuIcon, StarIcon } from "../components/icons";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";

type IconProps = { className?: string };

/* --- Roadmap-specific line icons, in the app's 20x20 / stroke-1.5 style --- */

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
      <path d="M10 16.5S3.5 12.5 3.5 7.8A3.3 3.3 0 0 1 10 6a3.3 3.3 0 0 1 6.5 1.8c0 4.7-6.5 8.7-6.5 8.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
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
      <path d="M10 6C8.5 5 5.8 4.6 4 5v10c1.8-.4 4.5 0 6 1 1.5-1 4.2-1.4 6-1V5c-1.8-.4-4.5 0-6 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
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

function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 16.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 5.2a2.5 2.5 0 0 1 0 4.6M14.6 12.2c1.5.5 2.4 1.8 2.4 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ThumbUpIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M7 8.5 10 3a1.6 1.6 0 0 1 2.3 1.9L11.5 8h3.6a1.6 1.6 0 0 1 1.6 1.9l-.9 4.6A1.6 1.6 0 0 1 14.2 16H7z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="3.5" y="8.5" width="3.5" height="7.5" rx="1" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Rotating header tints so the grid reads like a varied menu of dishes.
const TINTS = [
  { bg: "bg-mustard-100 dark:bg-mustard-900/30", fg: "text-mustard-700 dark:text-mustard-400" },
  { bg: "bg-primary-100 dark:bg-primary-900/30", fg: "text-primary-700 dark:text-primary-400" },
  { bg: "bg-rust-100 dark:bg-rust-900/30", fg: "text-rust-700 dark:text-rust-400" },
];

// Done icons run parallel to t.roadmap.done (same order, both languages).
const DONE_ICONS: ComponentType<IconProps>[] = [
  BarcodeIcon, CalendarIcon, HeartIcon, LeafIcon, CartIcon,
  BookIcon, ShareIcon, StarIcon, ExploreIcon, GridIcon, GlobeIcon,
];

// Planned icons are keyed by feature id so they stay put as votes reorder.
const PLANNED_ICON: Record<string, ComponentType<IconProps>> = {
  "shared-stock": UsersIcon,
  events: CalendarIcon,
  profiles: UserIcon,
  community: ExploreIcon,
};

type DoneFeature = { name: string; desc: string };
type PlannedFeature = {
  id: string;
  name: string;
  desc: string;
  objective: string;
  tasks: string[];
  how: string;
};

function DoneCard({ name, desc, status, Icon, tint }: {
  name: string;
  desc: string;
  status: string;
  Icon: ComponentType<IconProps>;
  tint: (typeof TINTS)[number];
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-line">
      <div className={`relative flex h-24 items-center justify-center opacity-60 ${tint.bg}`}>
        <Icon className={`h-9 w-9 ${tint.fg}`} />
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
          <CheckIcon className="h-3 w-3" />
          {status}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="font-medium text-muted line-through decoration-2">{name}</h3>
        <p className="text-sm text-muted">{desc}</p>
      </div>
    </article>
  );
}

export function Roadmap() {
  const { t } = useI18n();
  const r = t.roadmap;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // A device-scoped id so the same browser can't stack votes on one feature.
  const [voterKey] = useState(() => {
    const KEY = "shelf-roadmap-voter";
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(KEY, v);
    }
    return v;
  });

  useEffect(() => {
    api
      .get<{ counts: Record<string, number>; voted: string[] }>(
        `/api/roadmap/votes?voterKey=${encodeURIComponent(voterKey)}`,
      )
      .then((data) => {
        setCounts(data.counts);
        setVoted(new Set(data.voted));
      })
      .catch(() => {});
  }, [voterKey]);

  async function toggleVote(id: string) {
    const wasVoted = voted.has(id);
    // Optimistic: flip the vote and nudge the count, reconcile with the server.
    setVoted((prev) => {
      const next = new Set(prev);
      wasVoted ? next.delete(id) : next.add(id);
      return next;
    });
    setCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasVoted ? -1 : 1) }));

    try {
      const res = await api.post<{ featureId: string; count: number; voted: boolean }>(
        `/api/roadmap/votes/${id}`,
        { voterKey },
      );
      setCounts((prev) => ({ ...prev, [id]: res.count }));
      setVoted((prev) => {
        const next = new Set(prev);
        res.voted ? next.add(id) : next.delete(id);
        return next;
      });
    } catch {
      setVoted((prev) => {
        const next = new Set(prev);
        wasVoted ? next.add(id) : next.delete(id);
        return next;
      });
      setCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasVoted ? 1 : -1) }));
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Community decides the order: most-voted first, ties keep the source order.
  const rankedPlanned = [...(r.planned as PlannedFeature[])].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0),
  );

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col">
      <Header
        left={
          <button onClick={() => setSidebarOpen(true)} aria-label={t.nav.openMenu} className="text-muted">
            <MenuIcon className="h-6 w-6" />
          </button>
        }
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 space-y-8 px-4 py-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">{r.title}</h1>
          <p className="mt-1 text-sm text-muted">{r.subtitle}</p>
        </div>

        {/* Próximas — no forno, votáveis e expansíveis */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{r.plannedTitle}</p>
          <p className="mb-3 text-sm text-muted">{r.plannedHint}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rankedPlanned.map((item, index) => {
              const Icon = PLANNED_ICON[item.id] ?? CalendarIcon;
              const tint = TINTS[index % TINTS.length];
              const isVoted = voted.has(item.id);
              const isOpen = expanded.has(item.id);
              const count = counts[item.id] ?? 0;

              return (
                <article key={item.id} className="flex flex-col overflow-hidden rounded-lg border border-line">
                  <div className={`relative flex h-24 items-center justify-center ${tint.bg}`}>
                    <Icon className={`h-9 w-9 ${tint.fg}`} />
                    <span className="absolute left-2 top-2 rounded-full bg-on-photo px-2 py-0.5 text-xs font-semibold tabular-nums text-ink">
                      #{index + 1}
                    </span>
                    <span className="absolute right-2 top-2 rounded-full bg-on-photo px-2 py-0.5 text-xs font-medium text-ink">
                      {r.statusPlanned}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-3">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted">{item.desc}</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleVote(item.id)}
                        aria-pressed={isVoted}
                        aria-label={r.voteAria}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          isVoted ? "bg-primary-600 text-white" : "bg-surface-2 text-muted hover:text-ink"
                        }`}
                      >
                        <ThumbUpIcon className="h-4 w-4" filled={isVoted} />
                        <span className="tabular-nums">{count}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        aria-expanded={isOpen}
                        className="flex items-center gap-1 text-sm font-medium text-primary-600"
                      >
                        {isOpen ? r.detailsHide : r.detailsShow}
                        <ChevronIcon className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="space-y-3 border-t border-line pt-3 text-sm">
                        <div>
                          <p className="font-medium">{r.objectiveLabel}</p>
                          <p className="text-muted">{item.objective}</p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium">{r.tasksLabel}</p>
                          <ul className="space-y-1">
                            {item.tasks.map((task) => (
                              <li key={task} className="flex items-start gap-2 text-muted">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">{r.howLabel}</p>
                          <p className="text-muted">{item.how}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Já feitas — riscadas */}
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{r.doneTitle}</p>
          <p className="mb-3 text-sm text-muted">{r.doneHint}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(r.done as DoneFeature[]).map((feature, index) => (
              <DoneCard
                key={feature.name}
                name={feature.name}
                desc={feature.desc}
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
