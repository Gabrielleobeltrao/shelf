import { useEffect, useMemo, useState } from "react";
import { COUNTRY_BY_LANG, searchProducts } from "../../lib/openFoodFacts";
import type { ProductSearchResult } from "../../lib/openFoodFacts";
import { CloseIcon, SearchIcon } from "../icons";
import { EmptyState } from "../ui/EmptyState";
import { Portal } from "../ui/Portal";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";
import { EmptyShelfIllustration } from "../illustrations";
import { useI18n } from "../../lib/i18n";

export type LocalStockItem = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  barcode?: string;
};

type Props = {
  title?: string;
  onSelect: (product: ProductSearchResult) => void;
  onAddManually?: (query: string) => void;
  onClose: () => void;
  localItems?: LocalStockItem[];
};

function toSearchResult(item: LocalStockItem): ProductSearchResult {
  return {
    barcode: item.barcode ?? "",
    source: "local",
    localItemId: item._id,
    name: item.name,
    brand: item.brand ?? null,
    category: item.category ?? null,
    packageSize: null,
    imageUrl: item.imageUrl ?? null,
  };
}

export function ProductSearchModal({ title, onSelect, onAddManually, onClose, localItems = [] }: Props) {
  const { t, lang } = useI18n();
  const heading = title ?? t.productSearch.addItem;
  const country = COUNTRY_BY_LANG[lang] ?? "br";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    // Empty query = browsing: skip the network and show the pantry instead of
    // Open Food Facts' noisy popularity listing (which skews foreign).
    if (!query.trim()) {
      setResults([]);
      setHasMore(false);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      searchProducts(query, 1, country).then(({ products, hasMore: more, error: failed }) => {
        setResults(products);
        setPage(1);
        setHasMore(more);
        setError(failed);
        setLoading(false);
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, retryToken, country]);

  // Instant — no network round trip to search what the user already has.
  // Browsing (empty query) lists the whole pantry; typing filters it.
  const localMatches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return localItems.map(toSearchResult);
    if (term.length < 2) return [];

    return localItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(term) || (item.brand ?? "").toLowerCase().includes(term),
      )
      .map(toSearchResult);
  }, [query, localItems]);

  async function handleLoadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    const { products, hasMore: more, error: failed } = await searchProducts(query, nextPage, country);
    setResults((prev) => [...prev, ...products]);
    setPage(nextPage);
    setHasMore(more);
    setError(failed);
    setLoadingMore(false);
  }

  const browsing = !query.trim();
  const noResults = localMatches.length === 0 && results.length === 0;

  return (
    <Portal>
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col space-y-3 rounded-t-3xl bg-surface p-4 pb-safe"
      >
        <div className="mx-auto -mt-1 h-1 w-9 rounded-full bg-line" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{heading}</h2>
          <button onClick={onClose} aria-label={t.common.close} className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={t.productSearch.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl bg-surface-2 py-2 pl-9 pr-3 text-base"
          />
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {localMatches.length > 0 && (
            <div className="space-y-1 pb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {t.productSearch.inStockSection}
              </p>
              {localMatches.map((product) => (
                <ProductRow key={`local-${product.localItemId}`} product={product} onSelect={onSelect} />
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted">{t.common.loading}</p>
          ) : error && results.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">
                {onAddManually ? t.productSearch.errorWithManual : t.productSearch.errorNoManual}
              </p>
              <button
                type="button"
                onClick={() => setRetryToken((prev) => prev + 1)}
                className="text-sm font-medium text-primary-600"
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : noResults ? (
            browsing ? (
              <p className="text-sm text-muted">{t.productSearch.typeToSearch}</p>
            ) : (
              <EmptyState
                illustration={<EmptyShelfIllustration />}
                title={t.productSearch.notFoundTitle}
                description={onAddManually ? t.productSearch.notFoundWithManual : t.productSearch.notFoundNoManual}
              />
            )
          ) : (
            <>
              {results.length > 0 && localMatches.length > 0 && (
                <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted">
                  {t.productSearch.searchSection}
                </p>
              )}
              {results.map((product, index) => (
                <ProductRow key={`${product.barcode}-${index}`} product={product} onSelect={onSelect} />
              ))}

              {hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-2 text-sm font-medium text-primary-600 disabled:opacity-60"
                >
                  {loadingMore ? t.common.loading : t.common.loadMore}
                </button>
              )}
            </>
          )}
        </div>

        {onAddManually && (
          <button
            type="button"
            onClick={() => onAddManually(query)}
            className="w-full rounded-xl border border-primary-600 py-2.5 font-medium text-primary-600"
          >
            {t.productSearch.addManually}
          </button>
        )}
      </div>
    </div>
    </Portal>
  );
}

function ProductRow({ product, onSelect }: { product: ProductSearchResult; onSelect: (product: ProductSearchResult) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex w-full items-center gap-3 rounded-xl py-2 text-left hover:bg-surface-2"
    >
      <PhotoOrFallback
        src={product.imageUrl}
        imgClassName="h-12 w-12 shrink-0 rounded-xl object-cover"
        fallback={<div className="h-12 w-12 shrink-0 rounded-xl bg-surface" />}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate">{product.name}</p>
        {product.brand && <p className="truncate text-xs text-muted">{product.brand}</p>}
      </div>
    </button>
  );
}
