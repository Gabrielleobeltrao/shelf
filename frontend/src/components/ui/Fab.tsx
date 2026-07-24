import type { ReactNode } from "react";

type Props = {
  onClick: () => void;
  label: string;
  icon: ReactNode;
};

// Positioned to track the app shell's own responsive max-width (see
// AppLayout) instead of the raw viewport — otherwise on a wide desktop
// screen the button would sit pinned to the browser's corner, far from the
// actual (centered, narrower) content column.
export function Fab({ onClick, label, icon }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 mx-auto max-w-md px-4 md:max-w-2xl lg:max-w-4xl lg:px-6">
      <div className="flex justify-end">
        <button
          onClick={onClick}
          aria-label={label}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg"
        >
          {icon}
        </button>
      </div>
    </div>
  );
}
