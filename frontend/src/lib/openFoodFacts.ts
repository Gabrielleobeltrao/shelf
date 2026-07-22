import { normalizeCategory } from "./categories";
import { API_URL } from "./api";

export type OpenFoodFactsProduct = {
  name: string | null;
  brand: string | null;
  category: string | null;
  packageSize: string | null;
  imageUrl: string | null;
};

export type ProductSearchResult = OpenFoodFactsProduct & {
  barcode: string;
  source?: "local" | "off";
  localItemId?: string;
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
      category: normalizeCategory(product.categories),
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

type RawProduct = {
  code?: string;
  product_name?: string;
  // The search-a-licious API returns brands as an array, unlike the
  // legacy endpoints which used a comma-separated string.
  brands?: string[];
  categories?: string;
  quantity?: string;
  image_front_url?: string;
};

function mapProduct(product: RawProduct): ProductSearchResult | null {
  if (!product.product_name || !product.code) return null;
  return {
    barcode: product.code,
    source: "off",
    name: product.product_name,
    brand: product.brands?.[0]?.trim() || null,
    category: normalizeCategory(product.categories),
    packageSize: product.quantity || null,
    imageUrl: product.image_front_url || null,
  };
}

// Open Food Facts' relevance ranking doesn't account for how complete an
// entry is, so sparse near-duplicate entries (no photo, no category — often
// abandoned duplicates of a better-filled-out entry for the same product)
// can outrank the useful one. Bubble up complete entries first instead,
// keeping OFF's own order within each group.
function sortByCompleteness(products: ProductSearchResult[]): ProductSearchResult[] {
  const completeness = (p: ProductSearchResult) => Number(!!p.imageUrl) + Number(!!p.category);
  return products
    .map((product, index) => ({ product, index }))
    .sort((a, b) => completeness(b.product) - completeness(a.product) || a.index - b.index)
    .map(({ product }) => product);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(term: string, page: number): Promise<ProductSearchPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (term) params.set("q", term);

  const res = await fetch(`${API_URL}/api/product-search?${params}`, { credentials: "include" });
  if (!res.ok) return { products: [], hasMore: false, error: true };

  const data = await res.json();
  const rawProducts: RawProduct[] = Array.isArray(data?.hits) ? data.hits : [];
  const products = sortByCompleteness(
    rawProducts.map(mapProduct).filter((p): p is ProductSearchResult => p !== null),
  );
  const pageCount = typeof data?.page_count === "number" ? data.page_count : page;

  return { products, hasMore: page < pageCount, error: false };
}

// Spread out rather than fixed-interval: OFF's flakiness comes in waves, so
// spacing retries further apart gives a better chance of landing outside one.
const RETRY_DELAYS_MS = [400, 900, 1600];

/**
 * Goes through our own backend (see product-search.routes.ts), which proxies
 * to Open Food Facts' search-a-licious API — its relevance ranking is far
 * better than the legacy text-search endpoint (which matched loosely across
 * ingredient text, burying actually relevant products), and that API doesn't
 * send CORS headers so it can't be called directly from the browser anyway.
 * With an empty query, falls back to a popularity-sorted listing so the
 * picker isn't empty on first open.
 *
 * Our backend already retries against Open Food Facts internally, but retry
 * here too as a safety net against our own hiccups.
 */
export async function searchProducts(query: string, page = 1): Promise<ProductSearchPage> {
  const term = query.trim();

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await fetchPage(term, page);
      if (!result.error) return result;
    } catch {
      // fall through to retry
    }

    if (attempt < RETRY_DELAYS_MS.length) await wait(RETRY_DELAYS_MS[attempt]);
  }

  return { products: [], hasMore: false, error: true };
}
