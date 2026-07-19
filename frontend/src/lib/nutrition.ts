export const NUTRITION_OPTIONS = [
  { key: "calories", label: "Calorias", unit: "kcal" },
  { key: "carbs", label: "Carboidratos", unit: "g" },
  { key: "sugar", label: "Açúcares", unit: "g" },
  { key: "protein", label: "Proteínas", unit: "g" },
  { key: "fat", label: "Gorduras totais", unit: "g" },
  { key: "saturatedFat", label: "Gorduras saturadas", unit: "g" },
  { key: "fiber", label: "Fibra alimentar", unit: "g" },
  { key: "sodium", label: "Sódio", unit: "mg" },
] as const;

export type NutritionKey = (typeof NUTRITION_OPTIONS)[number]["key"];
