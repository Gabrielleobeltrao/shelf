const WEIGHT_TO_GRAMS: Record<string, number> = { g: 1, kg: 1000 };
const VOLUME_TO_ML: Record<string, number> = { ml: 1, l: 1000 };

function canonical(quantity: number, unit: string) {
  const key = unit.trim().toLowerCase();
  if (key in WEIGHT_TO_GRAMS) return { value: quantity * WEIGHT_TO_GRAMS[key], kind: "weight" };
  if (key in VOLUME_TO_ML) return { value: quantity * VOLUME_TO_ML[key], kind: "volume" };
  return { value: quantity, kind: "other", unit: key };
}

/**
 * Returns true/false when the stock quantity can be meaningfully compared
 * to what the recipe needs, or null when the units aren't convertible
 * (e.g. "xícara" vs "kg") and no conclusion can be drawn.
 */
export function hasEnoughStock(
  neededQuantity: number,
  neededUnit: string,
  stockQuantity: number,
  stockUnit: string,
): boolean | null {
  const needed = canonical(neededQuantity, neededUnit);
  const stock = canonical(stockQuantity, stockUnit);

  if (needed.kind !== stock.kind) return null;
  if (needed.kind === "other") {
    return needed.unit === stock.unit ? stockQuantity >= neededQuantity : null;
  }

  return stock.value >= needed.value;
}
