export type OpenFoodFactsProduct = {
  name: string | null;
  brand: string | null;
  category: string | null;
  packageSize: string | null;
  imageUrl: string | null;
};

export type ProductSearchResult = OpenFoodFactsProduct & {
  barcode: string;
};

export async function lookupProduct(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,categories,quantity,image_front_url`,
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data?.status !== 1) return null;

    const product = data.product ?? {};

    return {
      name: product.product_name || null,
      brand: product.brands?.split(",")[0]?.trim() || null,
      category: product.categories?.split(",")[0]?.trim() || null,
      packageSize: product.quantity || null,
      imageUrl: product.image_front_url || null,
    };
  } catch {
    return null;
  }
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query,
      )}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,categories,quantity,image_front_url`,
    );

    if (!res.ok) return [];

    const data = await res.json();
    const products = Array.isArray(data?.products) ? data.products : [];

    return products
      .filter((product: { product_name?: string; code?: string }) => product.product_name && product.code)
      .map(
        (product: {
          code: string;
          product_name: string;
          brands?: string;
          categories?: string;
          quantity?: string;
          image_front_url?: string;
        }) => ({
          barcode: product.code,
          name: product.product_name,
          brand: product.brands?.split(",")[0]?.trim() || null,
          category: product.categories?.split(",")[0]?.trim() || null,
          packageSize: product.quantity || null,
          imageUrl: product.image_front_url || null,
        }),
      );
  } catch {
    return [];
  }
}
