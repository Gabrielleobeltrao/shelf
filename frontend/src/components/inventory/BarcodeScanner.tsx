import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  onDetected: (code: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    BrowserMultiFormatReader.listVideoInputDevices()
      .then((found) => {
        if (cancelled) return;

        if (found.length === 0) {
          setError("Nenhuma câmera encontrada.");
          return;
        }

        setDevices(found);
        const backIndex = found.findIndex((d) => /back|traseira|rear|environment/i.test(d.label));
        if (backIndex >= 0) setDeviceIndex(backIndex);
      })
      .catch(() => setError("Não foi possível acessar a câmera."));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (devices.length === 0) return;

    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let cancelled = false;
    let detected = false;

    reader
      .decodeFromConstraints(
        {
          video: {
            deviceId: { exact: devices[deviceIndex].deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current ?? undefined,
        (result) => {
          if (cancelled || detected || !result) return;
          detected = true;
          controls?.stop();
          onDetectedRef.current(result.getText());
        },
      )
      .then((c) => {
        if (cancelled) {
          c.stop();
          return;
        }
        controls = c;
      })
      .catch(() => {
        setError("Não foi possível acessar a câmera.");
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [devices, deviceIndex]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-black">
      <video ref={videoRef} className="flex-1 object-cover" muted playsInline />

      {!error && (
        <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2">
          <div className="aspect-2/1 rounded-lg border-4 border-white/80" />
          <p className="mt-3 text-center text-sm text-white/90">
            Aproxime o código de barras dessa área
          </p>
        </div>
      )}

      {error && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-sm text-white">
          {error}
        </p>
      )}

      <div className="absolute inset-x-0 top-4 flex justify-between px-4">
        {devices.length > 1 ? (
          <button
            onClick={() => setDeviceIndex((i) => (i + 1) % devices.length)}
            className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium"
          >
            Trocar câmera
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={onClose}
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
