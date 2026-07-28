import { LANGUAGES, useI18n, type Lang } from "../../lib/i18n";

export function LanguageSelect({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label="Idioma / Language"
      className={`rounded-lg bg-surface-2 px-3 py-2 text-sm ${className}`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
