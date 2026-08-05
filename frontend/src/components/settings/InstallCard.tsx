import { useState, useSyncExternalStore } from "react";
import { canInstall, isIOS, isStandalone, promptInstall, subscribeInstall } from "../../lib/pwaInstall";
import { useI18n } from "../../lib/i18n";
import { DownloadIcon } from "../icons";

export function InstallCard() {
  const { t } = useI18n();
  const installable = useSyncExternalStore(subscribeInstall, canInstall, () => false);
  const [iosHelp, setIosHelp] = useState(false);

  // Already installed → nothing to offer. On browsers that can't install (and
  // aren't iOS, where we show instructions) hide it entirely.
  if (isStandalone()) return null;
  const ios = isIOS();
  if (!installable && !ios) return null;

  return (
    <div className="space-y-2 rounded-2xl bg-surface-2 p-4">
      <h2 className="text-sm font-medium text-muted">{t.install.title}</h2>
      <p className="text-sm text-muted">{t.install.desc}</p>
      <button
        onClick={() => (ios ? setIosHelp(true) : promptInstall())}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white"
      >
        <DownloadIcon className="h-4 w-4" />
        {t.install.button}
      </button>

      {iosHelp && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={() => setIosHelp(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full space-y-3 rounded-t-2xl bg-surface p-4"
          >
            <h3 className="text-lg font-semibold">{t.install.iosTitle}</h3>
            <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted">
              <li>{t.install.iosStep1}</li>
              <li>{t.install.iosStep2}</li>
            </ol>
            <button
              onClick={() => setIosHelp(false)}
              className="w-full rounded-lg bg-surface-2 py-2.5 text-sm font-medium"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
