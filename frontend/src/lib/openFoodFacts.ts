import { normalizeCategory } from "./categories";

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

const SEARCH_FIELDS = "code,product_name,brands,categories,quantity,image_front_url";
// Larger than a typical page so fewer "carregar mais" clicks are needed —
// each one is a fresh chance to hit Open Food Facts during a bad moment.
const PAGE_SIZE = 40;

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
    source: "off",
    name: product.product_name,
    brand: product.brands?.split(",")[0]?.trim() || null,
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

async function fetchPage(url: string, page: number): Promise<ProductSearchPage> {
  const res = await fetch(url);
  if (!res.ok) return { products: [], hasMore: false, error: true };

  const data = await res.json();
  const rawProducts: RawProduct[] = Array.isArray(data?.products) ? data.products : [];
  const products = sortByCompleteness(
    rawProducts.map(mapProduct).filter((p): p is ProductSearchResult => p !== null),
  );
  const count = typeof data?.count === "number" ? data.count : products.length;

  return { products, hasMore: page * PAGE_SIZE < count, error: false };
}

// Spread out rather than fixed-interval: OFF's flakiness comes in waves, so
// spacing retries further apart gives a better chance of landing outside one.
const RETRY_DELAYS_MS = [400, 900, 1600];

/**
 * With a query, uses the text-search endpoint. With an empty query, falls
 * back to a general popularity-sorted listing so the picker isn't empty on
 * first open. Both paginate the same way.
 *
 * Open Food Facts is prone to intermittent 503s on this API — observed on
 * both endpoints, not just the popularity listing, and not just page 1 — and
 * the error page lacks CORS headers, so the browser reports it as a CORS
 * failure (a rejected fetch) rather than a normal HTTP error. Retry with
 * backoff before giving up.
 */
export async function searchProducts(query: string, page = 1): Promise<ProductSearchPage> {
  const term = query.trim();
  const url = term
    ? `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        term,
      )}&search_simple=1&action=process&json=1&page_size=${PAGE_SIZE}&page=${page}&fields=${SEARCH_FIELDS}`
    : `https://world.openfoodfacts.org/api/v2/search?sort_by=popularity_key&page_size=${PAGE_SIZE}&page=${page}&fields=${SEARCH_FIELDS}`;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await fetchPage(url, page);
      if (!result.error) return result;
    } catch {
      // fall through to retry
    }

    if (attempt < RETRY_DELAYS_MS.length) await wait(RETRY_DELAYS_MS[attempt]);
  }

  return { products: [], hasMore: false, error: true };
}
