import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Item = {
  _id: string;
  name: string;
  brand?: string;
  unit: string;
  needsRestock?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShoppingCartModal({ open, onClose }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    api
      .get<Item[]>("/api/items")
      .then((data) => setItems(data.filter((item) => item.needsRestock)))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  async function handleBought(item: Item) {
    await api.patch(`/api/items/${item._id}`, { needsRestock: false });
    setItems((prev) => prev.filter((i) => i._id !== item._id));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-gray-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lista de compras</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Fechar
          </button>
        </div>

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
                <button
                  onClick={() => handleBought(item)}
                  className="shrink-0 rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-600"
                >
                  Comprado
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
