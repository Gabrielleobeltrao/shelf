export async function lookupProductName(barcode: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name`,
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data?.product?.product_name || null;
  } catch {
    return null;
  }
}
