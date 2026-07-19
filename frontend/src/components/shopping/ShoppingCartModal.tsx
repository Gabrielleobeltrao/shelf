import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type ShoppingListEntry = {
  _id: string;
  name: string;
  brand?: string;
  unit: string;
  sourceItemId?: string;
};

type StockItem = {
  _id: string;
  quantity: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShoppingCartModal({ open, onClose }: Props) {
  const [entries, setEntries] = useState<ShoppingListEntry[]>([]);
  const [stockById, setStockById] = useState<Map<string, StockItem>>(new Map());
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    Promise.all([
      api.get<ShoppingListEntry[]>("/api/shopping-list"),
      api.get<StockItem[]>("/api/items"),
    ])
      .then(([entriesData, itemsData]) => {
        setEntries(entriesData);
        setStockById(new Map(itemsData.map((item) => [item._id, item])));
        setBuyQuantities(Object.fromEntries(entriesData.map((entry) => [entry._id, 1])));
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  function adjustBuyQuantity(entryId: string, delta: number) {
    setBuyQuantities((prev) => ({
      ...prev,
      [entryId]: Math.max(0, (prev[entryId] ?? 0) + delta),
    }));
  }

  async function handleBought(entry: ShoppingListEntry) {
    const buyQuantity = buyQuantities[entry._id] ?? 0;
    const stockItem = entry.sourceItemId ? stockById.get(entry.sourceItemId) : undefined;

    if (stockItem) {
      await api.patch(`/api/items/${stockItem._id}`, {
        quantity: stockItem.quantity + buyQuantity,
      });
    }

    await api.delete(`/api/shopping-list/${entry._id}`);
    setEntries((prev) => prev.filter((e) => e._id !== entry._id));
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <aside className="relative flex h-full w-80 max-w-[85vw] flex-col bg-white p-4 dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lista de compras</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-500">Sua lista de compras está vazia.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {entries.map((entry) => (
                <li key={entry._id} className="space-y-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate">{entry.name}</p>
                    {entry.brand && (
                      <p className="truncate text-xs text-gray-500">{entry.brand}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustBuyQuantity(entry._id, -1)}
                        disabled={(buyQuantities[entry._id] ?? 0) <= 0}
                        aria-label={`Diminuir quantidade de ${entry.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base leading-none disabled:opacity-40 dark:border-gray-700"
                      >
                        −
                      </button>
                      <span className="min-w-14 whitespace-nowrap text-center text-sm text-gray-500">
                        {buyQuantities[entry._id] ?? 0} {entry.unit}
                      </span>
                      <button
                        onClick={() => adjustBuyQuantity(entry._id, 1)}
                        aria-label={`Aumentar quantidade de ${entry.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base leading-none dark:border-gray-700"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleBought(entry)}
                      className="shrink-0 rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-600"
                    >
                      Comprado
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
