import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShelfLogo } from "../icons";
import { useHeaderLogo } from "../../lib/headerLogo";

type Props = {
  left?: ReactNode;
  right?: ReactNode;
};

// The single header shell used across every page, so the top bar is
// identical system-wide. Pages only inject their own left/right actions;
// the bar, logo, spacing, and border never change.
export function Header({ left, right }: Props) {
  const { setVisible } = useHeaderLogo();
  const logoRef = useRef<HTMLAnchorElement>(null);

  // Report whether this header's logo is on screen, so the sidebar can show
  // its own logo only once this one scrolls away.
  useEffect(() => {
    const el = logoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => {
      observer.disconnect();
      setVisible(true);
    };
  }, [setVisible]);

  return (
    <header className="grid grid-cols-3 items-center border-b border-line px-4 py-3 sm:px-6 lg:px-8">
      <div className="justify-self-start">{left}</div>

      <Link ref={logoRef} to="/" className="flex items-center justify-self-center gap-2">
        <ShelfLogo className="h-6 w-6" />
        <span className="font-display text-lg font-semibold">Shelf</span>
      </Link>

      <div className="justify-self-end">{right}</div>
    </header>
  );
}
