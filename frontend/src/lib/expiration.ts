export function daysUntil(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expirationDate}T00:00:00`);
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000);
}

export function isExpired(expirationDate?: string): boolean {
  return !!expirationDate && daysUntil(expirationDate) < 0;
}

export function getExpirationWarning(expirationDate?: string): string | null {
  if (!expirationDate) return null;
  const days = daysUntil(expirationDate);
  if (days < 0) return "Vencido";
  if (days === 0) return "Vence hoje";
  if (days <= 7) return `Vence em ${days}d`;
  return null;
}
