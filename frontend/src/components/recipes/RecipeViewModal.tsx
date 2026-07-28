import { useState } from "react";
import { Link } from "react-router-dom";
import { BowlIllustration } from "../illustrations";
import { BackIcon, PencilIcon, TrashIcon } from "../icons";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";

type RecipeIngredient = {
  itemId: string;
  name?: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  _id: string;
  name: string;
  prepTime?: number;
  servings?: number;
  category?: string;
  ingredients: RecipeIngredient[];
  imageUrl?: string;
};

type Props = {
  recipe: Recipe;
  steps: string[];
  missingIds: Set<string>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function RecipeViewModal({ recipe, steps, missingIds, onClose, onEdit, onDelete }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-surface p-4"
      >
        <div className="flex items-center justify-between">
          <button onClick={onClose} aria-label="Voltar" className="text-muted">
            <BackIcon className="h-5 w-5" />
          </button>
          <Link to={`/receita/${recipe._id}`} className="text-sm font-medium text-primary-600">
            Abrir página
          </Link>
        </div>

        <PhotoOrFallback
          src={recipe.imageUrl}
          imgClassName="h-48 w-full rounded-lg object-cover"
          fallback={
            <div className="flex h-48 w-full items-center justify-center rounded-lg bg-mustard-100 dark:bg-mustard-900/30">
              <BowlIllustration className="h-24 w-auto" />
            </div>
          }
        />

        <div className="flex items-start justify-between gap-2">
          <p className="text-xl font-semibold">{recipe.name}</p>
          {recipe.ingredients.length > 0 &&
            (missingIds.size === 0 ? (
              <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                Dá pra fazer
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-rust-100 px-2 py-0.5 text-xs font-medium text-rust-700 dark:bg-rust-900/40 dark:text-rust-400">
                Falta {missingIds.size}
              </span>
            ))}
        </div>

        {(recipe.category || recipe.prepTime != null || recipe.servings != null) && (
          <div className="flex flex-wrap gap-x-3 text-sm text-muted">
            {recipe.category && <span>{recipe.category}</span>}
            {recipe.prepTime != null && <span>{recipe.prepTime} min</span>}
            {recipe.servings != null && <span>{recipe.servings} porções</span>}
          </div>
        )}

        {recipe.ingredients.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">Ingredientes</p>
            <ul className="space-y-0.5 text-sm">
              {recipe.ingredients.map((row, index) => (
                <li
                  key={`${row.itemId}-${index}`}
                  className={
                    missingIds.has(row.itemId) ? "text-rust-600 dark:text-rust-400" : "text-muted"
                  }
                >
                  {row.quantity} {row.unit} de {row.name || "Item removido"}
                </li>
              ))}
            </ul>
          </div>
        )}

        {steps.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">Modo de preparo</p>
            <ol className="list-inside list-decimal space-y-0.5 text-sm">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-rust-600 py-2.5 text-sm font-medium text-rust-600"
          >
            <TrashIcon className="h-4 w-4" />
            Excluir
          </button>
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Excluir "${recipe.name}"?`}
          description="A receita será removida permanentemente."
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
