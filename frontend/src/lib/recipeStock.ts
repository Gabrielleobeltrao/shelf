import { hasEnoughStock } from "./units";

type Ingredient = { itemId?: string; quantity: number; unit: string };
type Stock = { quantity: number; unit: string };

// Ingredients the pantry can't cover: one is "missing" when it has no linked
// stock item, or the linked item doesn't have enough on hand.
export function recipeMissing<T extends Ingredient>(
  ingredients: T[],
  itemsById: Map<string, Stock>,
): T[] {
  return ingredients.filter((row) => {
    const stock = row.itemId ? itemsById.get(row.itemId) : undefined;
    if (!stock) return true;
    return hasEnoughStock(row.quantity, row.unit, stock.quantity, stock.unit) === false;
  });
}

// A recipe is makeable when it has ingredients and none are missing. Saved
// (reference-only) recipes aren't linked to the user's stock, so they never
// qualify. Shared between the Recipes filter/badges and the Dashboard count so
// the "can make" number stays consistent across the app.
export function canMakeRecipe(
  recipe: { ingredients: Ingredient[]; savedFrom?: string },
  itemsById: Map<string, Stock>,
): boolean {
  return (
    !recipe.savedFrom &&
    recipe.ingredients.length > 0 &&
    recipeMissing(recipe.ingredients, itemsById).length === 0
  );
}
