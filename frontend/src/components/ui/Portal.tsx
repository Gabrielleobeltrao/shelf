import { type ReactNode } from "react";
import { createPortal } from "react-dom";

// Renders children at <body>, escaping the scrollable <main> in AppLayout.
// A position:fixed overlay nested inside an `overflow-y-auto` ancestor gets
// clipped to that ancestor's box, which left a ~16px gap below bottom-sheet
// modals. Portaling to the document root pins them to the viewport instead.
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
