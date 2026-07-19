import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { lookupProduct } from "../lib/openFoodFacts";
import { getExpirationWarning, isExpired } from "../lib/expiration";
import { CartIcon, PencilIcon, TrashIcon } from "../components/icons";
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
  expirationDate?: string;
  nutrition?: Record<string, number>;
  glutenFree?: boolean;
  vegan?: boolean;
};

type ShoppingListEntry = {
  _id: string;
  sourceItemId?: string;
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
    expirationDate: item.expirationDate ?? "",
    nutrition: Object.fromEntries(
      Object.entries(item.nutrition ?? {}).map(([key, value]) => [key, String(value)]),
    ),
    glutenFree: item.glutenFree ?? false,
    vegan: item.vegan ?? false,
  };
}

export function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settings, setSettingsState] = useState({
    trackExpiration: false,
    trackNutrition: false,
    nutritionFields: [] as string[],
    trackGlutenFree: false,
    trackVegan: false,
  });
  const [shoppingListMap, setShoppingListMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    Promise.all([
      api.get<Item[]>("/api/items"),
      api.get<typeof settings>("/api/settings"),
      api.get<ShoppingListEntry[]>("/api/shopping-list"),
    ])
      .then(([itemsData, settingsData, shoppingList]) => {
        setItems(itemsData);
        setSettingsState(settingsData);
        setShoppingListMap(
          new Map(
            shoppingList
              .filter((entry) => entry.sourceItemId)
              .map((entry) => [entry.sourceItemId!, entry._id]),
          ),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((item) => item.category?.trim()).filter(Boolean));
    return [...set].sort((a, b) => a!.localeCompare(b!));
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items
      .filter((item) => {
        if (categoryFilter && (item.category?.trim() || "") !== categoryFilter) return false;
        if (!term) return true;
        return (
          item.name.toLowerCase().includes(term) ||
          (item.brand ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search, categoryFilter]);

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
      expirationDate: data.expirationDate.trim(),
      nutrition: Object.fromEntries(
        Object.entries(data.nutrition)
          .filter(([, value]) => value.trim() !== "")
          .map(([key, value]) => [key, Number(value)]),
      ),
      glutenFree: data.glutenFree,
      vegan: data.vegan,
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

  async function handleDeleteItem(itemId: string) {
    await api.delete(`/api/items/${itemId}`);
    setItems((prev) => prev.filter((item) => item._id !== itemId));
  }

  async function handleDeleteFromModal() {
    if (modal?.mode !== "edit") return;
    await handleDeleteItem(modal.itemId);
    setModal(null);
  }

  async function handleToggleRestock(item: Item) {
    const existingEntryId = shoppingListMap.get(item._id);

    if (existingEntryId) {
      await api.delete(`/api/shopping-list/${existingEntryId}`);
      setShoppingListMap((prev) => {
        const next = new Map(prev);
        next.delete(item._id);
        return next;
      });
      return;
    }

    const entry = await api.post<ShoppingListEntry>("/api/shopping-list", {
      name: item.name,
      unit: item.unit,
      brand: item.brand,
      sourceItemId: item._id,
    });
    setShoppingListMap((prev) => new Map(prev).set(item._id, entry._id));
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
        expirationDate: "",
        nutrition: {},
        glutenFree: false,
        vegan: false,
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

      {items.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome ou marca"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-base dark:border-gray-700 dark:bg-gray-900"
          />
          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Abrir filtros"
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 dark:text-gray-400"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <path
                  d="M3 4.5h14l-5.5 6.5v5l-3 1.5v-6.5L3 4.5z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              {categoryFilter && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-600" />
              )}
            </button>
          )}
        </div>
      )}

      {filtersOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-black/50"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full space-y-3 rounded-t-2xl bg-white p-4 dark:bg-gray-950"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                Fechar
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Todas categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter("")}
                className="text-sm font-medium text-emerald-600"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum item no estoque ainda.</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum item encontrado.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {filteredItems.map((item) => {
            const secondaryInfo = item.brand || item.packageSize || "";
            const expired = settings.trackExpiration && isExpired(item.expirationDate);
            const expirationWarning =
              settings.trackExpiration && getExpirationWarning(item.expirationDate);

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
                className="flex cursor-pointer flex-col gap-1 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate">{item.name}</p>
                  {expirationWarning && (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                      {expirationWarning}
                    </span>
                  )}
                </div>

                <div className="flex items-stretch gap-3">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  )}

                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span className="min-w-0 truncate text-xs text-gray-500">
                      {secondaryInfo}
                    </span>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-end gap-2"
                    >
                      {expired ? (
                        <>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir "${item.name}" do estoque?`)) {
                                handleDeleteItem(item._id);
                              }
                            }}
                            aria-label={`Excluir ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-red-600 dark:border-gray-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setModal({
                                mode: "edit",
                                itemId: item._id,
                                initial: toFormData(item),
                              })
                            }
                            aria-label={`Editar ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleRestock(item)}
                            aria-label={`Adicionar ${item.name} à lista de compras`}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border text-base leading-none ${
                              shoppingListMap.has(item._id)
                                ? "border-emerald-600 text-emerald-600"
                                : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <CartIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal && (
        <ItemDetailModal
          title={modal.mode === "edit" ? "Editar item" : "Novo item"}
          initial={modal.initial}
          visibleFields={{
            expirationDate: settings.trackExpiration,
            nutritionFields: settings.trackNutrition ? settings.nutritionFields : [],
            glutenFree: settings.trackGlutenFree,
            vegan: settings.trackVegan,
          }}
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
