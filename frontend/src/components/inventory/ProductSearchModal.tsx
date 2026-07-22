import { useEffect, useState } from "react";
import { searchProducts } from "../../lib/openFoodFacts";
import type { ProductSearchResult } from "../../lib/openFoodFacts";
import { CloseIcon, SearchIcon } from "../icons";
import { EmptyState } from "../ui/EmptyState";
import { EmptyShelfIllustration } from "../illustrations";

type Props = {
  title?: string;
  onSelect: (product: ProductSearchResult) => void;
  onAddManually?: () => void;
  onClose: () => void;
};

export function ProductSearchModal({ title = "Adicionar item", onSelect, onAddManually, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setLoading(true);
    const delay = query.trim() ? 400 : 0;

    const timeout = setTimeout(() => {
      searchProducts(query, 1).then(({ products, hasMore: more, error: failed }) => {
        setResults(products);
        setPage(1);
        setHasMore(more);
        setError(failed);
        setLoading(false);
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [query, retryToken]);

  async function handleLoadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    const { products, hasMore: more, error: failed } = await searchProducts(query, nextPage);
    setResults((prev) => [...prev, ...products]);
    setPage(nextPage);
    setHasMore(more);
    setError(failed);
    setLoadingMore(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col space-y-3 rounded-t-2xl bg-white p-4 dark:bg-stone-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-stone-500 dark:text-stone-400">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {onAddManually && (
          <button
            type="button"
            onClick={onAddManually}
            className="w-full rounded-lg border border-primary-600 py-2.5 font-medium text-primary-600"
          >
            Adicionar manualmente
          </button>
        )}

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar produto por nome"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-base dark:border-stone-700 dark:bg-stone-900"
          />
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-stone-500">Carregando...</p>
          ) : error && results.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-stone-500">
                Não foi possível buscar produtos agora
                {onAddManually ? " — tente de novo ou adicione manualmente." : ". Tente de novo."}
              </p>
              <button
                type="button"
                onClick={() => setRetryToken((prev) => prev + 1)}
                className="text-sm font-medium text-primary-600"
              >
                Tentar de novo
              </button>
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              illustration={<EmptyShelfIllustration />}
              title="Nenhum produto encontrado"
              description={`Tente outro nome${onAddManually ? " ou adicione manualmente." : "."}`}
            />
          ) : (
            <>
              {results.map((product, index) => (
                <button
                  key={`${product.barcode}-${index}`}
                  type="button"
                  onClick={() => onSelect(product)}
                  className="flex w-full items-center gap-3 rounded-lg py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-900"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-stone-100 dark:bg-stone-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{product.name}</p>
                    {product.brand && (
                      <p className="truncate text-xs text-stone-500">{product.brand}</p>
                    )}
                  </div>
                </button>
              ))}

              {hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-2 text-sm font-medium text-primary-600 disabled:opacity-60"
                >
                  {loadingMore ? "Carregando..." : "Carregar mais"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
