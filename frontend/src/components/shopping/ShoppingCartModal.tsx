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
  const [buyQuantities, setBuyQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    api
      .get<Item[]>("/api/items")
      .then((data) => {
        const toBuy = data.filter((item) => item.needsRestock);
        setItems(toBuy);
        setBuyQuantities(Object.fromEntries(toBuy.map((item) => [item._id, "1"])));
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  async function handleBought(item: Item) {
    const buyQuantity = Number(buyQuantities[item._id]) || 0;
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
                <li key={item._id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate">{item.name}</p>
                    {item.brand && <p className="truncate text-xs text-gray-500">{item.brand}</p>}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={buyQuantities[item._id] ?? "1"}
                        onChange={(e) =>
                          setBuyQuantities((prev) => ({ ...prev, [item._id]: e.target.value }))
                        }
                        className="w-14 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                      />
                      <span className="text-xs text-gray-500">{item.unit}</span>
                    </div>
                    <button
                      onClick={() => handleBought(item)}
                      className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-600"
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
