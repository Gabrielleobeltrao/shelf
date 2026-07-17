import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { lookupProduct } from "../lib/openFoodFacts";
import type { ItemFormData } from "../components/inventory/ItemDetailModal";
import { ItemDetailModal } from "../components/inventory/ItemDetailModal";

const BarcodeScanner = lazy(() =>
  import("../components/inventory/BarcodeScanner").then((m) => ({ default: m.BarcodeScanner })),
);

type Item = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  brand?: string;
  packageSize?: string;
  imageUrl?: string;
  barcode?: string;
};

type ModalState =
  | { mode: "create"; initial: Partial<ItemFormData> }
  | { mode: "edit"; itemId: string; initial: Partial<ItemFormData> };

function toFormData(item: Item): Partial<ItemFormData> {
  return {
    name: item.name,
    brand: item.brand ?? "",
    category: item.category ?? "",
    packageSize: item.packageSize ?? "",
    quantity: String(item.quantity),
    unit: item.unit,
    barcode: item.barcode ?? "",
    imageUrl: item.imageUrl ?? "",
  };
}

export function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api
      .get<Item[]>("/api/items")
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const byCategory = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.category?.trim() || "Sem categoria";
      const list = byCategory.get(key) ?? [];
      list.push(item);
      byCategory.set(key, list);
    }
    return [...byCategory.entries()]
      .map(([category, categoryItems]) => ({
        category,
        items: categoryItems.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => {
        if (a.category === "Sem categoria") return 1;
        if (b.category === "Sem categoria") return -1;
        return a.category.localeCompare(b.category);
      });
  }, [items]);

  async function handleSave(data: ItemFormData) {
    if (!modal) return;

    const payload = {
      name: data.name.trim(),
      brand: data.brand.trim(),
      category: data.category.trim(),
      packageSize: data.packageSize.trim(),
      quantity: Number(data.quantity) || 1,
      unit: data.unit.trim() || "un",
      barcode: data.barcode.trim(),
      imageUrl: data.imageUrl.trim(),
    };

    if (modal.mode === "edit") {
      const updated = await api.patch<Item>(`/api/items/${modal.itemId}`, payload);
      setItems((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } else {
      const created = await api.post<Item>("/api/items", payload);
      setItems((prev) => [created, ...prev]);
    }

    setModal(null);
  }

  async function handleStep(item: Item, delta: number) {
    if (pendingIds.has(item._id)) return;
    const quantity = Math.max(0, item.quantity + delta);
    if (quantity === item.quantity) return;

    setPendingIds((prev) => new Set(prev).add(item._id));
    try {
      const updated = await api.patch<Item>(`/api/items/${item._id}`, { quantity });
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    }
  }

  async function handleDeleteFromModal() {
    if (modal?.mode !== "edit") return;
    await api.delete(`/api/items/${modal.itemId}`);
    setItems((prev) => prev.filter((item) => item._id !== modal.itemId));
    setModal(null);
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

    const product = await lookupProduct(code);
    setModal({
      mode: "create",
      initial: {
        name: product?.name ?? "",
        brand: product?.brand ?? "",
        category: product?.category ?? "",
        packageSize: product?.packageSize ?? "",
        quantity: "1",
        unit: "un",
        barcode: code,
        imageUrl: product?.imageUrl ?? "",
      },
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Estoque</h1>

      <div className="flex gap-2">
        <button
          onClick={() =>
            setModal({
              mode: "create",
              initial: { quantity: "1", unit: "un" },
            })
          }
          className="flex-1 rounded-lg bg-emerald-600 py-2.5 font-medium text-white"
        >
          Adicionar item
        </button>
        <button
          onClick={() => setScanning(true)}
          className="flex-1 rounded-lg border border-emerald-600 py-2.5 font-medium text-emerald-600"
        >
          Escanear
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum item no estoque ainda.</p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group.category}
              </h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {group.items.map((item) => {
                  const secondaryInfo = item.brand || item.packageSize || "";

                  return (
                    <li
                      key={item._id}
                      onClick={() =>
                        setModal({
                          mode: "edit",
                          itemId: item._id,
                          initial: toFormData(item),
                        })
                      }
                      className="flex cursor-pointer items-stretch gap-3 py-2"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      )}

                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                        <p className="truncate">{item.name}</p>

                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs text-gray-500">
                            {secondaryInfo}
                          </span>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex shrink-0 items-center gap-2"
                          >
                            <button
                              onClick={() => handleStep(item, -1)}
                              disabled={pendingIds.has(item._id) || item.quantity <= 0}
                              aria-label={`Diminuir quantidade de ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base leading-none disabled:opacity-40 dark:border-gray-700"
                            >
                              −
                            </button>
                            <span className="min-w-14 whitespace-nowrap text-center text-sm text-gray-500">
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              onClick={() => handleStep(item, 1)}
                              disabled={pendingIds.has(item._id)}
                              aria-label={`Aumentar quantidade de ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-base leading-none disabled:opacity-40 dark:border-gray-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ItemDetailModal
          title={modal.mode === "edit" ? "Editar item" : "Novo item"}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal.mode === "edit" ? handleDeleteFromModal : undefined}
        />
      )}

      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />
        </Suspense>
      )}
    </div>
  );
}
