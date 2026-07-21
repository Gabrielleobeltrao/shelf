import { useEffect, useState } from "react";
import { searchProducts } from "../../lib/openFoodFacts";
import type { ProductSearchResult } from "../../lib/openFoodFacts";

type Props = {
  onSelect: (product: ProductSearchResult) => void;
  onAddManually: () => void;
  onClose: () => void;
};

export function ProductSearchModal({ onSelect, onAddManually, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      searchProducts(term).then((found) => {
        setResults(found);
        setSearched(true);
        setLoading(false);
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col space-y-3 rounded-t-2xl bg-white p-4 dark:bg-gray-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Adicionar item</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Fechar
          </button>
        </div>

        <button
          type="button"
          onClick={onAddManually}
          className="w-full rounded-lg border border-emerald-600 py-2.5 font-medium text-emerald-600"
        >
          Adicionar manualmente
        </button>

        <input
          type="text"
          placeholder="Buscar produto por nome"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />

        <div className="flex-1 space-y-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Buscando...</p>
          ) : query.trim().length > 0 && query.trim().length < 2 ? (
            <p className="text-sm text-gray-500">Digite pelo menos 2 letras.</p>
          ) : searched && results.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum produto encontrado. Tente outro nome ou adicione manualmente.
            </p>
          ) : (
            results.map((product) => (
              <button
                key={product.barcode}
                type="button"
                onClick={() => onSelect(product)}
                className="flex w-full items-center gap-3 rounded-lg py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate">{product.name}</p>
                  {product.brand && (
                    <p className="truncate text-xs text-gray-500">{product.brand}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
