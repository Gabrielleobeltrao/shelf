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

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let cancelled = false;
    let detected = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
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
      })
      .catch(() => {
        setError("Não foi possível acessar a câmera.");
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-black">
      <video ref={videoRef} className="flex-1 object-cover" muted playsInline />

      {error && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-sm text-white">
          {error}
        </p>
      )}

      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium"
      >
        Fechar
      </button>
    </div>
  );
}
