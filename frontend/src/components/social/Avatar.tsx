type Props = { src?: string; name: string; size?: number; className?: string };

// Round avatar with an initial fallback (used across profile, feed, comments).
export function Avatar({ src, name, size = 40, className = "" }: Props) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size };
  if (src) {
    return (
      <img src={src} alt={name} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: size * 0.42 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-display font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 ${className}`}
    >
      {initial}
    </span>
  );
}
