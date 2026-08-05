import { useI18n } from "../../lib/i18n";
import { BellIcon } from "../icons";

type Props = {
  count: number;
  onClick: () => void;
  className?: string;
};

// Bell with a count badge. Used in the mobile header; the desktop sidebar
// renders its own nav-style row with the same badge treatment.
export function NotificationsBell({ count, onClick, className }: Props) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      aria-label={t.notifications.bellAria(count)}
      className={`relative ${className ?? "text-muted"}`}
    >
      <BellIcon className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust-600 px-1 text-[0.6rem] font-semibold leading-none text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
