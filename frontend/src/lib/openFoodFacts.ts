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

export type ProductSearchPage = {
  products: ProductSearchResult[];
  hasMore: boolean;
  error: boolean;
};

const SEARCH_FIELDS = "code,product_name,brands,categories,quantity,image_front_url";
const PAGE_SIZE = 20;

type RawProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_front_url?: string;
};

function mapProduct(product: RawProduct): ProductSearchResult | null {
  if (!product.product_name || !product.code) return null;
  return {
    barcode: product.code,
    name: product.product_name,
    brand: product.brands?.split(",")[0]?.trim() || null,
    category: product.categories?.split(",")[0]?.trim() || null,
    packageSize: product.quantity || null,
    imageUrl: product.image_front_url || null,
  };
}

/**
 * With a query, uses the text-search endpoint. With an empty query, falls
 * back to a general popularity-sorted listing so the picker isn't empty on
 * first open. Both paginate the same way.
 */
export async function searchProducts(query: string, page = 1): Promise<ProductSearchPage> {
  const term = query.trim();

  try {
    const url = term
      ? `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          term,
        )}&search_simple=1&action=process&json=1&page_size=${PAGE_SIZE}&page=${page}&fields=${SEARCH_FIELDS}`
      : `https://world.openfoodfacts.org/api/v2/search?sort_by=popularity_key&page_size=${PAGE_SIZE}&page=${page}&fields=${SEARCH_FIELDS}`;

    const res = await fetch(url);
    if (!res.ok) return { products: [], hasMore: false, error: true };

    const data = await res.json();
    const rawProducts: RawProduct[] = Array.isArray(data?.products) ? data.products : [];
    const products = rawProducts.map(mapProduct).filter((p): p is ProductSearchResult => p !== null);
    const count = typeof data?.count === "number" ? data.count : products.length;

    return { products, hasMore: page * PAGE_SIZE < count, error: false };
  } catch {
    // Open Food Facts occasionally 503s the popularity listing without CORS
    // headers on the error page, which the browser reports as a CORS
    // failure (a rejected fetch) rather than a normal HTTP error.
    return { products: [], hasMore: false, error: true };
  }
}
