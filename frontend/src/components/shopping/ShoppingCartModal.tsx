import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Item = {
  _id: string;
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  needsRestock?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShoppingCartModal({ open, onClose }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    api
      .get<Item[]>("/api/items")
      .then((data) => {
        const toBuy = data.filter((item) => item.needsRestock);
        setItems(toBuy);
        setBuyQuantities(Object.fromEntries(toBuy.map((item) => [item._id, 1])));
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  function adjustBuyQuantity(itemId: string, delta: number) {
    setBuyQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta),
    }));
  }

  async function handleBought(item: Item) {
    const buyQuantity = buyQuantities[item._id] ?? 0;
    await api.patch(`/api/items/${item._id}`, {
      needsRestock: false,
      quantity: item.quantity + buyQuantity,
    });
    setItems((prev) => prev.filter((i) => i._id !== item._id));
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
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">Sua lista de compras está vazia.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((item) => (
                <li key={item._id} className="space-y-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate">{item.name}</p>
                    {item.brand && <p className="truncate text-xs text-gray-500">{item.brand}</p>}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustBuyQuantity(item._id, -1)}
                        disabled={(buyQuantities[item._id] ?? 0) <= 0}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base leading-none disabled:opacity-40 dark:border-gray-700"
                      >
                        −
                      </button>
                      <span className="min-w-14 whitespace-nowrap text-center text-sm text-gray-500">
                        {buyQuantities[item._id] ?? 0} {item.unit}
                      </span>
                      <button
                        onClick={() => adjustBuyQuantity(item._id, 1)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base leading-none dark:border-gray-700"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleBought(item)}
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
