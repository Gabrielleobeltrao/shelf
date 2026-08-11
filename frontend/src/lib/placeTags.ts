// Curated place-tag taxonomy (keys must mirror backend/src/lib/placeTags.ts).
// Users pick these when reviewing a place; they aggregate onto the place.
// Emoji is unicode for now — a custom SVG "Shelf emoji" set can replace `emoji`
// later without touching the keys.
export type PlaceTag = { key: string; emoji: string; pt: string; en: string };

export const PLACE_TAGS: PlaceTag[] = [
  { key: "romantic", emoji: "❤️", pt: "Romântico", en: "Romantic" },
  { key: "family", emoji: "👨‍👩‍👧", pt: "Em família", en: "Family-friendly" },
  { key: "groups", emoji: "👥", pt: "Bom p/ grupos", en: "Good for groups" },
  { key: "cheap", emoji: "💸", pt: "Barato", en: "Cheap eats" },
  { key: "fancy", emoji: "🥂", pt: "Requintado", en: "Fancy" },
  { key: "cozy", emoji: "🕯️", pt: "Aconchegante", en: "Cozy" },
  { key: "view", emoji: "🌅", pt: "Vista bonita", en: "Great view" },
  { key: "outdoors", emoji: "🌳", pt: "Ao ar livre", en: "Outdoor seating" },
  { key: "vegan", emoji: "🌱", pt: "Vegano", en: "Vegan-friendly" },
  { key: "petfriendly", emoji: "🐶", pt: "Pet friendly", en: "Pet friendly" },
  { key: "fast", emoji: "⚡", pt: "Rápido", en: "Quick bite" },
  { key: "dessert", emoji: "🍰", pt: "Sobremesas", en: "Great desserts" },
  { key: "drinks", emoji: "🍸", pt: "Drinks", en: "Great drinks" },
  { key: "brunch", emoji: "🍳", pt: "Brunch", en: "Brunch" },
];

const byKey = new Map(PLACE_TAGS.map((t) => [t.key, t]));

export function placeTag(key: string): PlaceTag | undefined {
  return byKey.get(key);
}

export function placeTagLabel(key: string, lang: string): string {
  const t = byKey.get(key);
  if (!t) return key;
  return `${t.emoji} ${lang === "pt" ? t.pt : t.en}`;
}
