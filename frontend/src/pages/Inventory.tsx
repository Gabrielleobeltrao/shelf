import { lazy, Suspense, useEffect, useState } from "react";
import { api } from "../lib/api";
import { lookupProductName } from "../lib/openFoodFacts";

const BarcodeScanner = lazy(() =>
  import("../components/inventory/BarcodeScanner").then((m) => ({ default: m.BarcodeScanner })),
);

type Item = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  barcode?: string;
};

export function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("un");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Item[]>("/api/items")
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const item = await api.post<Item>("/api/items", {
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      barcode: scannedBarcode ?? undefined,
    });

    setItems((prev) => [item, ...prev]);
    setName("");
    setQuantity("1");
    setScannedBarcode(null);
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/items/${id}`);
    setItems((prev) => prev.filter((item) => item._id !== id));
  }

  async function handleDetected(code: string) {
    setScanning(false);

    const existing = items.find((item) => item.barcode === code);
    if (existing) {
      const updated = await api.patch<Item>(`/api/items/${existing._id}`, {
        quantity: existing.quantity + 1,
      });
      setItems((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      return;
    }

    setScannedBarcode(code);
    const productName = await lookupProductName(code);
    if (productName) setName(productName);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Estoque</h1>

      <button
        onClick={() => setScanning(true)}
        className="w-full rounded-lg border border-emerald-600 py-2.5 font-medium text-emerald-600"
      >
        Escanear código de barras
      </button>

      {scannedBarcode && (
        <p className="text-sm text-gray-500">
          Código {scannedBarcode} escaneado — confirme os dados abaixo para adicionar.
        </p>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Item"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
        >
          +
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum item no estoque ainda.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {items.map((item) => (
            <li key={item._id} className="flex items-center justify-between py-3">
              <span>{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {item.quantity} {item.unit}
                </span>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="text-sm text-red-600"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />
        </Suspense>
      )}
    </div>
  );
}
