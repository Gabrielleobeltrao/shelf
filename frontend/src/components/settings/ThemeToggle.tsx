import { useTheme, type Theme } from "../../lib/theme";
import { useI18n } from "../../lib/i18n";

const OPTIONS: Theme[] = ["light", "dark", "system"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  const label = (o: Theme) =>
    o === "light" ? t.theme.light : o === "dark" ? t.theme.dark : t.theme.system;

  return (
    <div className="flex rounded-full bg-surface p-1">
      {OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => setTheme(o)}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            theme === o ? "bg-ink text-surface" : "text-muted"
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}
