export function daysUntil(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expirationDate}T00:00:00`);
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000);
}

export function isExpired(expirationDate?: string): boolean {
  return !!expirationDate && daysUntil(expirationDate) < 0;
}

import type { Dict } from "./i18n";

// Returns a translated expiration label, or null when the item isn't
// close enough to expiry to warn about. Takes the dictionary so the
// wording follows the selected language, and a threshold (days before
// expiry) so the user's alert window drives who gets flagged.
export function getExpirationWarning(
  t: Dict,
  expirationDate?: string,
  withinDays = 7,
): string | null {
  if (!expirationDate) return null;
  const days = daysUntil(expirationDate);
  if (days < 0) return t.expiration.expired;
  if (days === 0) return t.expiration.today;
  if (days <= withinDays) return t.expiration.inDays(days);
  return null;
}
