import { TrashIcon } from "../icons";
import { useI18n } from "../../lib/i18n";
import { Portal } from "./Portal";

type Props = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const confirm = confirmLabel ?? t.common.delete;
  const cancel = cancelLabel ?? t.common.cancel;
  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/50"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full space-y-5 rounded-t-2xl bg-surface p-5"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rust-100 dark:bg-rust-900/40">
            <TrashIcon className="h-5 w-5 text-rust-600 dark:text-rust-400" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-line py-2.5 font-medium"
          >
            {cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-rust-600 py-2.5 font-medium text-white"
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
