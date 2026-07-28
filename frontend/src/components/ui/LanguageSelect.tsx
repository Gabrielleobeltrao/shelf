import { LANGUAGES, useI18n } from "../../lib/i18n";

// Segmented pill toggle — matches the app's rounded chip aesthetic and the
// primary-highlighted active state used across filters and nav.
export function LanguageSelect({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      role="radiogroup"
      aria-label="Idioma / Language"
      className={`inline-flex rounded-full border border-line bg-bg p-0.5 ${className}`}
    >
      {LANGUAGES.map((l) => {
        const active = l.value === lang;
        return (
          <button
            key={l.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLang(l.value)}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary-600 text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
