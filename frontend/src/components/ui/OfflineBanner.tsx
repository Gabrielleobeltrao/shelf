import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n";

// A thin bar at the bottom while the device is offline, so it's clear the
// screen is showing saved data rather than live data.
export function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-mustard-600 px-4 py-1.5 pb-safe text-center text-xs font-medium text-white">
      {t.offline.banner}
    </div>
  );
}
