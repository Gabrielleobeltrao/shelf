import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { CheckIcon, CloseIcon, MinusIcon, PlusIcon } from "../icons";
import { EmptyState } from "../ui/EmptyState";
import { EmptyShelfIllustration } from "../illustrations";

type ShoppingListEntry = {
  _id: string;
  name: string;
  brand?: string;
  unit: string;
  imageUrl?: string;
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

      <aside className="relative flex h-full w-80 max-w-[85vw] flex-col bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lista de compras</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-muted">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted">Carregando...</p>
          ) : entries.length === 0 ? (
            <EmptyState
              illustration={<EmptyShelfIllustration />}
              title="Sua lista está vazia"
              description="Marque itens como 'Comprar' no estoque pra vê-los aqui."
            />
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry._id} className="space-y-2 rounded-xl bg-surface-2 p-3">
                  <div className="flex items-center gap-3">
                    {entry.imageUrl ? (
                      <img src={entry.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-11 w-11 shrink-0 rounded-lg bg-surface" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.name}</p>
                      {entry.brand && (
                        <p className="truncate text-xs text-muted">{entry.brand}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustBuyQuantity(entry._id, -1)}
                        disabled={(buyQuantities[entry._id] ?? 0) <= 0}
                        aria-label={`Diminuir quantidade de ${entry.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <span className="min-w-14 whitespace-nowrap text-center text-sm text-muted">
                        {buyQuantities[entry._id] ?? 0} {entry.unit}
                      </span>
                      <button
                        onClick={() => adjustBuyQuantity(entry._id, 1)}
                        aria-label={`Aumentar quantidade de ${entry.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleBought(entry)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
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
