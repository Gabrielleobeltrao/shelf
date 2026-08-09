import type { ComponentType } from "react";

type IconProps = { className?: string };

// Pantry / cabinet — double doors with a shelf.
function PantryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="4" y="3" width="12" height="14" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 10h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.5 6v1.5M8.5 12.5v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Fridge — tall body split into fridge + freezer compartments, with handles.
function FridgeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="5.5" y="2.5" width="9" height="15" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 8h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 4.5v1.5M8 10v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Freezer — snowflake.
function FreezerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 3v14M4.05 6.5 15.95 13.5M15.95 6.5 4.05 13.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Location values are stored in Portuguese (see lib/locations.ts).
const ICONS: Record<string, ComponentType<IconProps>> = {
  Despensa: PantryIcon,
  Geladeira: FridgeIcon,
  Freezer: FreezerIcon,
};

export function getLocationIcon(location: string): ComponentType<IconProps> {
  return ICONS[location] ?? PantryIcon;
}
