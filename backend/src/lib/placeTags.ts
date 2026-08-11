// Allowed place-tag keys (must mirror frontend/src/lib/placeTags.ts). Tags are
// chosen by users on a check-in and aggregated onto the place (tagCounts).
export const PLACE_TAG_KEYS = [
  "romantic",
  "family",
  "groups",
  "cheap",
  "fancy",
  "cozy",
  "view",
  "outdoors",
  "vegan",
  "petfriendly",
  "fast",
  "dessert",
  "drinks",
  "brunch",
] as const;

const allowed = new Set<string>(PLACE_TAG_KEYS);

// Sanitize an incoming tag list: keep known keys only, unique, capped.
export function cleanPlaceTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    const key = String(raw);
    if (allowed.has(key) && !out.includes(key)) out.push(key);
    if (out.length >= 6) break;
  }
  return out;
}
