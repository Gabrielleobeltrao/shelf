import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { CloseIcon } from "../icons";
import { useI18n } from "../../lib/i18n";

type Props = {
  onDetected: (code: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  // null = let the browser pick the back camera via facingMode. We only use an
  // explicit deviceId once the user switches cameras — enumerating devices
  // up front returns empty/unusable ids until camera permission is granted,
  // which is exactly why the old flow broke in a freshly installed PWA.
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let cancelled = false;
    let detected = false;

    const video: MediaTrackConstraints = deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: "environment" } };
    video.width = { ideal: 1920 };
    video.height = { ideal: 1080 };

    reader
      .decodeFromConstraints({ video }, videoRef.current ?? undefined, (result) => {
        if (cancelled || detected || !result) return;
        detected = true;
        controls?.stop();
        onDetectedRef.current(result.getText());
      })
      .then((c) => {
        if (cancelled) {
          c.stop();
          return;
        }
        controls = c;
        setError(null);
        // Permission is granted now, so labels/ids are available — enumerate
        // for the camera switcher.
        BrowserMultiFormatReader.listVideoInputDevices()
          .then((found) => {
            if (!cancelled) setDevices(found);
          })
          .catch(() => {});
      })
      .catch((e: unknown) => {
        const name = (e as { name?: string })?.name;
        if (name === "NotAllowedError") setError(t.barcode.permissionDenied);
        else if (name === "NotFoundError" || name === "OverconstrainedError")
          setError(t.barcode.noCamera);
        else setError(t.barcode.cameraError);
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [deviceId]);

  // Cycle to the next camera (only meaningful once we've enumerated them).
  function switchCamera() {
    if (devices.length < 2) return;
    const current = deviceId ? devices.findIndex((d) => d.deviceId === deviceId) : -1;
    setDeviceId(devices[(current + 1) % devices.length].deviceId);
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-black">
      <video ref={videoRef} className="flex-1 object-cover" muted playsInline />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/70 to-transparent" />
      <p className="pointer-events-none absolute inset-x-0 top-5 text-center font-display text-base font-semibold text-white">
        {t.barcode.title}
      </p>

      {!error && (
        <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2">
          <div className="relative aspect-2/1">
            <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-primary-400" />
            <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-primary-400" />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-primary-400" />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-primary-400" />
          </div>
          <p className="mt-3 text-center text-sm text-white/90">
            {t.barcode.hint}
          </p>
        </div>
      )}

      {error && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-sm text-white">
          {error}
        </p>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />

      <div className="absolute inset-x-0 top-4 flex justify-between px-4">
        {devices.length > 1 ? (
          <button
            onClick={switchCamera}
            className="rounded-full bg-on-photo px-4 py-2 text-sm font-medium text-ink"
          >
            {t.barcode.changeCamera}
          </button>
        ) : (
          <span />
        )}

        <button onClick={onClose} aria-label={t.common.close} className="rounded-full bg-on-photo p-2.5">
          <CloseIcon className="h-4 w-4 text-ink" />
        </button>
      </div>
    </div>
  );
}
