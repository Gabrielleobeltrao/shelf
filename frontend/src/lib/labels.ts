import type { Dict } from "./i18n";

// Recipe tags and item categories are stored in Portuguese (the source
// vocabulary). These translate the stored value for display, falling back to
// the raw value for anything custom the user typed that isn't in the map.
export function tagLabel(t: Dict, tag?: string | null): string {
  if (!tag) return "";
  return (t.tags as Record<string, string>)[tag] ?? tag;
}

export function categoryLabel(t: Dict, category?: string | null): string {
  if (!category) return "";
  return t.categories[category] ?? category;
}
