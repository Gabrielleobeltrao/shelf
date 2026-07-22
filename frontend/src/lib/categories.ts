export const CATEGORY_OPTIONS = [
  "Laticínios",
  "Grãos e Cereais",
  "Bebidas",
  "Temperos e Condimentos",
  "Limpeza",
  "Higiene",
  "Congelados",
  "Enlatados e Conservas",
  "Hortifruti",
  "Padaria",
  "Carnes",
  "Doces e Sobremesas",
  "Outros",
];

// Open Food Facts' `categories` field is a noisy, multi-language tag list
// (e.g. "en:dairies, en:fresh-milks, Leites, en:cow-milks") edited by its
// community rather than curated — showing it as-is means raw English slugs
// leaking into a Portuguese UI, plus near-duplicate tags for the same
// product. Map it to our own fixed vocabulary by keyword instead of trusting
// it directly.
const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: "Laticínios", keywords: ["dairy", "dairies", "milk", "cheese", "yogurt", "yoghurt", "leite", "queijo", "iogurte", "laticín"] },
  { category: "Grãos e Cereais", keywords: ["cereal", "grain", "rice", "pasta", "noodle", "flour", "wheat", "oat", "arroz", "grão", "massa", "farinha", "macarrão", "aveia"] },
  { category: "Bebidas", keywords: ["beverage", "drink", "juice", "soda", "water", "coffee", "tea", "beer", "wine", "bebida", "suco", "refrigerante", "água", "café", "chá", "cerveja", "vinho"] },
  { category: "Temperos e Condimentos", keywords: ["spice", "condiment", "sauce", "seasoning", "herb", "tempero", "condimento", "molho", "especiaria"] },
  { category: "Limpeza", keywords: ["clean", "detergent", "household", "limpeza", "detergente"] },
  { category: "Higiene", keywords: ["hygiene", "personal-care", "cosmetic", "higiene"] },
  { category: "Congelados", keywords: ["frozen", "ice-cream", "congelado", "sorvete"] },
  { category: "Enlatados e Conservas", keywords: ["canned", "conserve", "preserved", "jar", "enlatado", "conserva"] },
  { category: "Hortifruti", keywords: ["fruit", "vegetable", "produce", "fruta", "legume", "verdura", "hortifruti"] },
  { category: "Padaria", keywords: ["bread", "bakery", "pão", "padaria", "pao"] },
  { category: "Carnes", keywords: ["meat", "poultry", "fish", "seafood", "sausage", "carne", "frango", "peixe", "linguiça"] },
  { category: "Doces e Sobremesas", keywords: ["dessert", "sweet", "candy", "chocolate", "cookie", "biscuit", "cake", "doce", "sobremesa", "bolacha", "bolo"] },
];

/**
 * Maps a raw Open Food Facts category tag list to one of our own category
 * options. Returns "Outros" when there's category data but nothing matches
 * a known keyword, and null when there was no category data at all.
 */
export function normalizeCategory(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;

  const haystack = raw.toLowerCase();
  const match = CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
  return match?.category ?? "Outros";
}
