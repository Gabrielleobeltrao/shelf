import { CheckIcon } from "../icons";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

// Styled checkbox that fills with the primary color and shows the app's
// check icon when active — replaces the OS-default checkbox.
export function Checkbox({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm text-muted"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked
            ? "border-primary-600 bg-primary-600 text-white"
            : "border-line bg-surface"
        }`}
      >
        {checked && <CheckIcon className="h-3.5 w-3.5" />}
      </span>
      <span>{label}</span>
    </button>
  );
}
