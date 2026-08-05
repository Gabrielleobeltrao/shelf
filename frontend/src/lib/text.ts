// Loose, human-friendly name matching for pantry items and ingredients:
// accent- and case-insensitive, whitespace-trimmed. Used to line recipes up
// with the pantry and to merge shopping-list buys into existing items.
export function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
