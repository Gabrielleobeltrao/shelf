import type { ReactNode } from "react";

type Props = {
  onClick: () => void;
  label: string;
  icon: ReactNode;
};

export function Fab({ onClick, label, icon }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fab-glow fixed bottom-safe right-4 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white sm:right-6 lg:right-8"
    >
      {icon}
    </button>
  );
}
