import { useState, type ReactNode } from "react";

type Props = {
  src?: string | null;
  alt?: string;
  imgClassName: string;
  fallback: ReactNode;
};

// Product photos come from Open Food Facts, whose image CDN has real,
// observed outages (connection refused, not just 404s) — a URL that's
// perfectly valid can still fail to load. Falls back to the same empty
// state used when there's no photo at all, instead of a broken image icon.
export function PhotoOrFallback({ src, alt = "", imgClassName, fallback }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return <img src={src} alt={alt} onError={() => setFailed(true)} className={imgClassName} />;
}
