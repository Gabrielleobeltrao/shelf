import type { ReactElement } from "react";

type IconProps = { className?: string };

function LeafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 17c0-6 3-10 7-11-1 7-3 10-7 11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 17c0-5-2-8-6-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DairyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7 3h6l1.5 4.5a5 5 0 1 1-9 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function GrainIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 17V9M10 17V6M14 17v-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="6" cy="7" rx="1.6" ry="2.2" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="10" cy="4" rx="1.6" ry="2.2" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="14" cy="6" rx="1.6" ry="2.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CupIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M8 3h4l1 5v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 3V2h4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SprayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M6 4h8l-1 4H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="8" y="8" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SnowflakeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2v16M2 10h16M4.5 4.5l11 11M15.5 4.5l-11 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BreadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 9c0-3.5 2.5-6 6-6s6 2.5 6 6v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 9v2M10 9v2M13 9v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MeatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M7 6c2-2.5 6-2.5 8 0 2 2.5 1.5 6-1 8-1 1-2 1-3 .5L8 17l-2-2 2.5-2.5C8 11 7.5 10 8 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DessertIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 8h12l-1.5 8h-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 8c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function JarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="5" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const CATEGORY_RULES: { keywords: string[]; Icon: (props: IconProps) => ReactElement; tint: "sage" | "mustard" }[] = [
  { keywords: ["hortifruti", "fruta", "verdura", "legume"], Icon: LeafIcon, tint: "sage" },
  { keywords: ["laticín", "leite", "queijo", "iogurte"], Icon: DairyIcon, tint: "mustard" },
  { keywords: ["grão", "grao", "cereal", "arroz", "massa", "farinha"], Icon: GrainIcon, tint: "sage" },
  { keywords: ["bebida", "suco", "água", "agua", "refrigerante"], Icon: CupIcon, tint: "mustard" },
  { keywords: ["limpeza", "higiene"], Icon: SprayIcon, tint: "sage" },
  { keywords: ["congelado"], Icon: SnowflakeIcon, tint: "mustard" },
  { keywords: ["padaria", "pão", "pao"], Icon: BreadIcon, tint: "mustard" },
  { keywords: ["carne"], Icon: MeatIcon, tint: "sage" },
  { keywords: ["doce", "sobremesa", "temper", "condiment"], Icon: DessertIcon, tint: "mustard" },
];

export function getCategoryIcon(category?: string): { Icon: (props: IconProps) => ReactElement; tint: "sage" | "mustard" } {
  const normalized = (category ?? "").toLowerCase();
  const match = CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  return match ?? { Icon: JarIcon, tint: "sage" };
}
