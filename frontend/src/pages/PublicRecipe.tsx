import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../lib/api";
import { PencilIcon, ShelfLogo } from "../components/icons";
import { BowlIllustration, EmptyShelfIllustration } from "../components/illustrations";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";

type PublicRecipeData = {
  recipe: {
    _id: string;
    name: string;
    category?: string;
    prepTime?: number;
    servings?: number;
    imageUrl?: string;
    ingredients: { name?: string; quantity: number; unit: string }[];
    steps: string[];
    isPublic: boolean;
  };
  authorName: string | null;
  isOwner: boolean;
};

export function PublicRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicRecipeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    // credentials so the backend can recognize the owner (edit button +
    // private-recipe preview); the page still works with no session at all.
    fetch(`${API_URL}/api/public/recipes/${id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <ShelfLogo className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">Shelf</span>
        </Link>

        {data?.isOwner && (
          <button
            onClick={() => navigate(`/receitas?editar=${data.recipe._id}`)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Editar
          </button>
        )}
      </header>

      <main className="flex-1 space-y-4 px-4 py-4">
        {loading ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : !data ? (
          <EmptyState
            illustration={<EmptyShelfIllustration />}
            title="Receita não encontrada"
            description="Essa receita não existe ou não está pública."
          />
        ) : (
          <>
            {data.isOwner && !data.recipe.isPublic && (
              <p className="rounded-lg bg-mustard-100 px-3 py-2 text-sm text-mustard-700 dark:bg-mustard-900/40 dark:text-mustard-400">
                Esta receita está privada — só você consegue ver esta página. Torne-a pública
                ao editar pra compartilhar o link.
              </p>
            )}

            <PhotoOrFallback
              src={data.recipe.imageUrl}
              imgClassName="h-56 w-full rounded-xl object-cover"
              fallback={
                <div className="flex h-56 w-full items-center justify-center rounded-xl bg-mustard-100 dark:bg-mustard-900/30">
                  <BowlIllustration className="h-24 w-auto" />
                </div>
              }
            />

            <div>
              <h1 className="text-2xl font-semibold">{data.recipe.name}</h1>
              {data.authorName && <p className="mt-0.5 text-sm text-muted">por {data.authorName}</p>}
            </div>

            {(data.recipe.category || data.recipe.prepTime != null || data.recipe.servings != null) && (
              <div className="flex flex-wrap gap-x-3 text-sm text-muted">
                {data.recipe.category && <span>{data.recipe.category}</span>}
                {data.recipe.prepTime != null && <span>{data.recipe.prepTime} min</span>}
                {data.recipe.servings != null && <span>{data.recipe.servings} porções</span>}
              </div>
            )}

            {data.recipe.ingredients.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  Ingredientes
                </p>
                <ul className="space-y-0.5 text-sm">
                  {data.recipe.ingredients.map((row, index) => (
                    <li key={index} className="text-muted">
                      {row.quantity} {row.unit} de {row.name || "Item removido"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.recipe.steps.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  Modo de preparo
                </p>
                <ol className="list-inside list-decimal space-y-1 text-sm">
                  {data.recipe.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
