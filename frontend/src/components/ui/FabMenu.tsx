import { useState, type ReactNode } from "react";
import { CloseIcon, PlusIcon } from "../icons";
import { Portal } from "./Portal";

type Action = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

// Expandable floating action button (speed dial): the main "+" opens a small
// stack of labeled actions above it.
export function FabMenu({ actions, label = "Abrir ações" }: { actions: Action[]; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <Portal>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
        </Portal>
      )}

      <div className="fixed bottom-safe right-4 z-30 flex flex-col items-end gap-3 sm:right-6 lg:right-8">
        {open &&
          actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className="flex items-center gap-2.5"
            >
              <span className="rounded-xl bg-surface px-3 py-1.5 text-xs font-semibold shadow-md">
                {action.label}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-primary-600 shadow-lg">
                {action.icon}
              </span>
            </button>
          ))}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={label}
          aria-expanded={open}
          className="fab-glow flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white transition-transform"
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
