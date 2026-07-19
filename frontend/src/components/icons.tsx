type IconProps = {
  className?: string;
};

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6M5.5 6l.6 9a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9l.6-9M8.5 9v5M11.5 9v5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M12.5 3.5l4 4L6 18H2v-4L12.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3 4h2l1.6 9.2a1.5 1.5 0 0 0 1.5 1.3h6.3a1.5 1.5 0 0 0 1.5-1.2L17 7H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="8" cy="17" r="1" fill="currentColor" />
      <circle cx="14" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}
