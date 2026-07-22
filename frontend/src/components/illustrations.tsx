type IllustrationProps = {
  className?: string;
};

export function PantryShelfIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 168 118" fill="none" className={className}>
      <ellipse cx="40" cy="106" rx="26" ry="5" className="fill-stone-200 dark:fill-stone-800" />
      <ellipse cx="84" cy="108" rx="30" ry="5.5" className="fill-stone-200 dark:fill-stone-800" />
      <ellipse cx="130" cy="105" rx="22" ry="4.5" className="fill-stone-200 dark:fill-stone-800" />
      <rect x="10" y="98" width="148" height="8" rx="4" className="fill-primary-700 dark:fill-primary-400" />
      <rect
        x="20"
        y="52"
        width="42"
        height="50"
        rx="9"
        className="fill-primary-100 dark:fill-primary-900/40 stroke-primary-700 dark:stroke-primary-400"
        strokeWidth="2.5"
      />
      <rect x="28" y="40" width="26" height="16" rx="4" className="fill-primary-700 dark:fill-primary-400" />
      <path
        d="M41 40 C 41 30, 50 28, 48 18"
        className="stroke-primary-600 dark:stroke-primary-300"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M48 18 C 44 20, 44 24, 47 26"
        className="stroke-primary-600 dark:stroke-primary-300"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="66"
        y="34"
        width="50"
        height="68"
        rx="10"
        className="fill-mustard-100 dark:fill-mustard-900/40 stroke-mustard-700 dark:stroke-mustard-400"
        strokeWidth="2.5"
      />
      <rect x="75" y="22" width="32" height="16" rx="4" className="fill-mustard-700 dark:fill-mustard-400" />
      <rect
        x="122"
        y="58"
        width="34"
        height="44"
        rx="8"
        className="fill-stone-100 dark:fill-stone-900 stroke-stone-400 dark:stroke-stone-600"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <rect
        x="129"
        y="49"
        width="20"
        height="12"
        rx="3"
        className="fill-stone-100 dark:fill-stone-900 stroke-stone-400 dark:stroke-stone-600"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
    </svg>
  );
}

export function EmptyShelfIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 150 118" fill="none" className={className}>
      <rect x="8" y="86" width="134" height="8" rx="4" className="fill-primary-700 dark:fill-primary-400" />
      <ellipse cx="46" cy="94" rx="24" ry="5" className="fill-stone-200 dark:fill-stone-800" />
      <rect
        x="26"
        y="42"
        width="40"
        height="46"
        rx="9"
        className="fill-primary-100 dark:fill-primary-900/40 stroke-primary-700 dark:stroke-primary-400"
        strokeWidth="2.5"
      />
      <rect x="34" y="30" width="24" height="15" rx="4" className="fill-primary-700 dark:fill-primary-400" />
      <rect
        x="82"
        y="50"
        width="42"
        height="38"
        rx="9"
        className="stroke-stone-400 dark:stroke-stone-600"
        strokeWidth="2.2"
        strokeDasharray="5 5"
      />
      <rect
        x="90"
        y="38"
        width="26"
        height="15"
        rx="4"
        className="stroke-stone-400 dark:stroke-stone-600"
        strokeWidth="2.2"
        strokeDasharray="5 5"
      />
      <circle cx="103" cy="68" r="10" className="fill-stone-50 dark:fill-stone-900 stroke-stone-400 dark:stroke-stone-600" strokeWidth="2" />
      <path d="M103 63v10M98 68h10" className="stroke-stone-400 dark:stroke-stone-600" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BowlIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 84 74" fill="none" className={className}>
      <path
        d="M20 12c0 4 2 6 2 6M32 8c0 5 3 7 3 7M44 12c0 4 2 6 2 6"
        className="stroke-mustard-700 dark:stroke-mustard-400"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="46" rx="30" ry="10" className="fill-stone-50 dark:fill-stone-950" />
      <path
        d="M4 46c0 12 12 22 28 22s28-10 28-22"
        fill="none"
        className="stroke-mustard-700 dark:stroke-mustard-400"
        strokeWidth="3"
      />
    </svg>
  );
}
