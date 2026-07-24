import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { lookupProduct } from "../lib/openFoodFacts";
import type { ProductSearchResult } from "../lib/openFoodFacts";
import { getExpirationWarning, isExpired } from "../lib/expiration";
import { BarcodeIcon, CartIcon, MinusIcon, PlusIcon, SearchIcon } from "../components/icons";
import { getCategoryIcon } from "../lib/categoryIcon";
import { EmptyState } from "../components/ui/EmptyState";
import { Fab } from "../components/ui/Fab";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { EmptyShelfIllustration } from "../components/illustrations";
import type { ItemFormData } from "../components/inventory/ItemDetailModal";
import { ItemDetailModal } from "../components/inventory/ItemDetailModal";
import { ProductSearchModal } from "../components/inventory/ProductSearchModal";
import { ItemViewModal } from "../components/inventory/ItemViewModal";

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
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
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
      imageUrl: item.imageUrl,
      sourceItemId: item._id,
    });
    setShoppingListMap((prev) => new Map(prev).set(item._id, entry._id));
  }

  function handleSelectSearchProduct(product: ProductSearchResult) {
    setProductSearchOpen(false);

    if (product.source === "local" && product.localItemId) {
      setViewingItemId(product.localItemId);
      return;
    }

    setModal({
      mode: "create",
      initial: {
        name: product.name ?? "",
        brand: product.brand ?? "",
        category: product.category ?? "",
        packageSize: product.packageSize ?? "",
        quantity: "1",
        unit: "un",
        barcode: product.barcode,
        imageUrl: product.imageUrl ?? "",
        expirationDate: "",
        nutrition: {},
        glutenFree: false,
        vegan: false,
      },
    });
  }

  function handleAddManually() {
    setProductSearchOpen(false);
    setModal({
      mode: "create",
      initial: { quantity: "1", unit: "un" },
    });
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
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Estoque</h1>
        <button
          onClick={() => setScanning(true)}
          aria-label="Escanear código de barras"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink"
        >
          <BarcodeIcon className="h-4 w-4" />
        </button>
      </div>

      {items.length > 0 && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou marca"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-surface-2 py-2 pl-9 pr-3 text-base"
          />
        </div>
      )}

      {categories.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto overflow-y-visible px-1 py-1.5">
          {categories.map((category) => {
            const { Icon: ChipIcon, tint } = getCategoryIcon(category);
            const active = categoryFilter === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(active ? "" : category!)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  tint === "mustard"
                    ? "bg-mustard-100 text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400"
                    : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                } ${active ? "ring-2 ring-primary-600" : ""}`}
              >
                <ChipIcon className="h-4 w-4" />
                {category}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<EmptyShelfIllustration />}
          title="Seu estoque está vazio"
          description="Escaneie um código de barras ou busque um produto pra começar."
        />
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-muted">Nenhum item encontrado.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const secondaryInfo = item.brand || item.packageSize || "";
            const expired = settings.trackExpiration && isExpired(item.expirationDate);
            const outOfStock = item.quantity <= 0;
            const showActions = expired || outOfStock;
            const statusBadge =
              (settings.trackExpiration && getExpirationWarning(item.expirationDate)) ||
              (outOfStock ? "Sem estoque" : null);
            const { Icon: CategoryIcon, tint } = getCategoryIcon(item.category);

            return (
              <li
                key={item._id}
                onClick={() => setViewingItemId(item._id)}
                className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 p-4"
              >
                <PhotoOrFallback
                  src={item.imageUrl}
                  imgClassName="h-14 w-14 shrink-0 rounded-xl object-cover"
                  fallback={<div className="h-14 w-14 shrink-0 rounded-xl bg-surface" />}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-base font-semibold">{item.name}</p>
                    {statusBadge && (
                      <span className="shrink-0 rounded-full bg-rust-100 px-2 py-0.5 text-xs font-medium text-rust-700 dark:bg-rust-900/40 dark:text-rust-400">
                        {statusBadge}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 truncate text-sm text-muted">
                      {item.category && (
                        <CategoryIcon
                          className={`h-3.5 w-3.5 shrink-0 ${
                            tint === "mustard" ? "text-mustard-600 dark:text-mustard-400" : "text-primary-600 dark:text-primary-400"
                          }`}
                        />
                      )}
                      <span className="truncate">{item.category || secondaryInfo}</span>
                    </span>

                    <div onClick={(e) => e.stopPropagation()} className="flex shrink-0 items-center gap-1.5">
                      {showActions ? (
                        <>
                          <button
                            onClick={() => handleToggleRestock(item)}
                            aria-label={`Adicionar ${item.name} à lista de compras`}
                            className={`flex h-8 w-16 items-center justify-center rounded-lg border bg-surface ${
                              shoppingListMap.has(item._id)
                                ? "border-primary-600 text-primary-600"
                                : "border-line text-muted"
                            }`}
                          >
                            <CartIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStep(item, 1)}
                            disabled={pendingIds.has(item._id)}
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStep(item, -1)}
                            disabled={pendingIds.has(item._id) || item.quantity <= 0}
                            aria-label={`Diminuir quantidade de ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
                          >
                            <MinusIcon className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-14 whitespace-nowrap text-center text-sm font-medium">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => handleStep(item, 1)}
                            disabled={pendingIds.has(item._id)}
                            aria-label={`Aumentar quantidade de ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
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

      {viewingItemId &&
        (() => {
          const viewingItem = items.find((i) => i._id === viewingItemId);
          if (!viewingItem) return null;

          const viewExpired = settings.trackExpiration && isExpired(viewingItem.expirationDate);
          const viewOutOfStock = viewingItem.quantity <= 0;
          const viewStatusBadge =
            (settings.trackExpiration && getExpirationWarning(viewingItem.expirationDate)) ||
            (viewOutOfStock ? "Sem estoque" : null);

          return (
            <ItemViewModal
              item={viewingItem}
              visibleFields={{
                expirationDate: settings.trackExpiration,
                nutritionFields: settings.trackNutrition ? settings.nutritionFields : [],
                glutenFree: settings.trackGlutenFree,
                vegan: settings.trackVegan,
              }}
              statusBadge={viewStatusBadge}
              showActions={viewExpired || viewOutOfStock}
              inShoppingList={shoppingListMap.has(viewingItem._id)}
              pending={pendingIds.has(viewingItem._id)}
              onClose={() => setViewingItemId(null)}
              onEdit={() => {
                setViewingItemId(null);
                setModal({
                  mode: "edit",
                  itemId: viewingItem._id,
                  initial: toFormData(viewingItem),
                });
              }}
              onDelete={() => {
                setViewingItemId(null);
                handleDeleteItem(viewingItem._id);
              }}
              onToggleRestock={() => handleToggleRestock(viewingItem)}
              onStep={(delta) => handleStep(viewingItem, delta)}
            />
          );
        })()}

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

      {productSearchOpen && (
        <ProductSearchModal
          onSelect={handleSelectSearchProduct}
          onAddManually={handleAddManually}
          onClose={() => setProductSearchOpen(false)}
          localItems={items}
        />
      )}

      <Fab onClick={() => setProductSearchOpen(true)} label="Adicionar item" icon={<PlusIcon className="h-6 w-6" />} />
    </div>
  );
}
