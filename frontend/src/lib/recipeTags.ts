// Fixed set of recipe tags. The user picks the single one that best
// represents a recipe, and the public explore page filters by these — so
// the vocabulary has to be closed (no free text) to keep filtering coherent
// across everyone's recipes.
export const RECIPE_TAGS = [
  "Café da manhã",
  "Almoço",
  "Jantar",
  "Lanche",
  "Sobremesa",
  "Bebida",
  "Massas",
  "Saladas",
  "Carnes",
  "Vegetariano",
  "Sopas",
  "Padaria",
] as const;

export type RecipeTag = (typeof RECIPE_TAGS)[number];
