import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShelfLogo } from "../icons";

type Props = {
  left?: ReactNode;
  right?: ReactNode;
};

// Mobile top bar only — on desktop the docked sidebar handles navigation and
// this header is hidden. Pages inject their own left/right actions.
export function Header({ left, right }: Props) {
  return (
    <header className="grid grid-cols-3 items-center border-b border-line px-4 py-3 sm:px-6 lg:hidden">
      <div className="justify-self-start">{left}</div>

      <Link to="/" className="flex items-center justify-self-center gap-2">
        <ShelfLogo className="h-6 w-6" />
        <span className="font-display text-lg font-semibold">Shelf</span>
      </Link>

      <div className="justify-self-end">{right}</div>
    </header>
  );
}
