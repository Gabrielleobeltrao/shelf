import { NUTRITION_OPTIONS } from "../../lib/nutrition";
import { CartIcon, TrashIcon } from "../icons";

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

type VisibleFields = {
  expirationDate: boolean;
  nutritionFields: string[];
  glutenFree: boolean;
  vegan: boolean;
};

type Props = {
  item: Item;
  visibleFields: VisibleFields;
  statusBadge: string | null;
  showActions: boolean;
  inShoppingList: boolean;
  pending: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleRestock: () => void;
  onStep: (delta: number) => void;
};

export function ItemViewModal({
  item,
  visibleFields,
  statusBadge,
  showActions,
  inShoppingList,
  pending,
  onClose,
  onEdit,
  onDelete,
  onToggleRestock,
  onStep,
}: Props) {
  const nutritionEntries = visibleFields.nutritionFields
    .map((key) => ({ option: NUTRITION_OPTIONS.find((o) => o.key === key), value: item.nutrition?.[key] }))
    .filter((entry) => entry.option && entry.value != null);

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-gray-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Detalhes do item</h2>
          <button onClick={onClose} className="text-sm text-gray-500 dark:text-gray-400">
            Fechar
          </button>
        </div>

        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-48 w-full rounded-lg object-cover" />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-gray-800">
            Sem foto
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xl font-semibold">{item.name}</p>
            {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
          </div>
          {statusBadge && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
              {statusBadge}
            </span>
          )}
        </div>

        <div className="space-y-1 text-sm">
          {item.category && (
            <p>
              <span className="text-gray-500">Categoria: </span>
              {item.category}
            </p>
          )}
          {item.packageSize && (
            <p>
              <span className="text-gray-500">Embalagem: </span>
              {item.packageSize}
            </p>
          )}
          {item.barcode && (
            <p>
              <span className="text-gray-500">Código de barras: </span>
              {item.barcode}
            </p>
          )}
          {visibleFields.expirationDate && item.expirationDate && (
            <p>
              <span className="text-gray-500">Validade: </span>
              {new Date(`${item.expirationDate}T00:00:00`).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        {nutritionEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-1 text-sm">
            {nutritionEntries.map(({ option, value }) => (
              <p key={option!.key}>
                <span className="text-gray-500">{option!.label}: </span>
                {value} {option!.unit}
              </p>
            ))}
          </div>
        )}

        {((visibleFields.glutenFree && item.glutenFree) || (visibleFields.vegan && item.vegan)) && (
          <div className="flex gap-2">
            {visibleFields.glutenFree && item.glutenFree && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                Sem glúten
              </span>
            )}
            {visibleFields.vegan && item.vegan && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                Vegano
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 border-y border-gray-200 py-3 dark:border-gray-800">
          <button
            onClick={() => onStep(-1)}
            disabled={pending || item.quantity <= 0}
            aria-label="Diminuir quantidade"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-lg leading-none disabled:opacity-40 dark:border-gray-700"
          >
            −
          </button>
          <span className="min-w-20 text-center text-lg">
            {item.quantity} {item.unit}
          </span>
          <button
            onClick={() => onStep(1)}
            disabled={pending}
            aria-label="Aumentar quantidade"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-lg leading-none disabled:opacity-40 dark:border-gray-700"
          >
            +
          </button>
        </div>

        {showActions && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm(`Excluir "${item.name}" do estoque?`)) onDelete();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-600 py-2.5 text-sm font-medium text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
              Excluir
            </button>
            <button
              onClick={onToggleRestock}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium ${
                inShoppingList
                  ? "border-emerald-600 text-emerald-600"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              <CartIcon className="h-4 w-4" />
              {inShoppingList ? "Na lista" : "Comprar"}
            </button>
          </div>
        )}

        <button
          onClick={onEdit}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white"
        >
          Editar
        </button>
      </div>
    </div>
  );
}
