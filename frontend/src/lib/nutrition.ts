// Labels come from the translation dictionary (t.nutrition[key]); only the
// key and unit live here since the unit is language-agnostic.
export const NUTRITION_OPTIONS = [
  { key: "calories", unit: "kcal" },
  { key: "carbs", unit: "g" },
  { key: "sugar", unit: "g" },
  { key: "protein", unit: "g" },
  { key: "fat", unit: "g" },
  { key: "saturatedFat", unit: "g" },
  { key: "fiber", unit: "g" },
  { key: "sodium", unit: "mg" },
] as const;

export type NutritionKey = (typeof NUTRITION_OPTIONS)[number]["key"];
