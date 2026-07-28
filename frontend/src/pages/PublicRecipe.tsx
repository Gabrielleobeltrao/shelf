import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../lib/api";
import { BookmarkIcon, CheckIcon, PencilIcon, ShelfLogo, StarIcon } from "../components/icons";
import { BowlIllustration, EmptyShelfIllustration } from "../components/illustrations";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";

type Comment = {
  _id: string;
  authorName: string;
  text: string;
  createdAt: string;
  mine: boolean;
};

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
  isLoggedIn: boolean;
  rating: { average: number; count: number; mine: number | null };
  comments: Comment[];
  saved: boolean;
};

const STARS = [1, 2, 3, 4, 5, 6];

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.status === 204 ? null : res.json();
}

export function PublicRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicRecipeData | null>(null);
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/api/public/recipes/${id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRate(stars: number) {
    if (!data || !id) return;
    const rating = await apiCall(`/api/public/recipes/${id}/rating`, {
      method: "PUT",
      body: JSON.stringify({ stars }),
    });
    setData({ ...data, rating });
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !id || !commentText.trim()) return;
    setPostingComment(true);
    try {
      const comment = await apiCall(`/api/public/recipes/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() }),
      });
      setData({ ...data, comments: [comment, ...data.comments] });
      setCommentText("");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!data || !id) return;
    await apiCall(`/api/public/recipes/${id}/comments/${commentId}`, { method: "DELETE" });
    setData({ ...data, comments: data.comments.filter((c) => c._id !== commentId) });
  }

  async function handleSave() {
    if (!data || !id) return;
    setSaving(true);
    try {
      await apiCall(`/api/public/recipes/${id}/save`, { method: "POST" });
      setData({ ...data, saved: true });
    } finally {
      setSaving(false);
    }
  }

  const canInteract = data && data.isLoggedIn && !data.isOwner;

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

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold">{data.recipe.name}</h1>
                {data.authorName && (
                  <p className="mt-0.5 text-sm text-muted">por {data.authorName}</p>
                )}
              </div>

              {canInteract && (
                <button
                  onClick={handleSave}
                  disabled={saving || data.saved}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    data.saved
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                      : "bg-primary-600 text-white"
                  }`}
                >
                  <BookmarkIcon className="h-4 w-4" filled={data.saved} />
                  {data.saved ? "Salva" : "Salvar"}
                </button>
              )}
            </div>

            {(data.recipe.category || data.recipe.prepTime != null || data.recipe.servings != null) && (
              <div className="flex flex-wrap gap-x-3 text-sm text-muted">
                {data.recipe.category && <span>{data.recipe.category}</span>}
                {data.recipe.prepTime != null && <span>{data.recipe.prepTime} min</span>}
                {data.recipe.servings != null && <span>{data.recipe.servings} porções</span>}
              </div>
            )}

            {/* Avaliação */}
            <div className="rounded-xl bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums">
                  {data.rating.count > 0 ? data.rating.average.toFixed(1) : "—"}
                </span>
                <span className="text-sm text-muted">
                  {data.rating.count === 0
                    ? "Sem avaliações"
                    : `${data.rating.count} ${data.rating.count === 1 ? "avaliação" : "avaliações"}`}
                </span>
              </div>

              {canInteract ? (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-muted">
                    {data.rating.mine ? "Sua avaliação" : "Avalie esta receita"}
                  </p>
                  <div className="flex gap-1" onMouseLeave={() => setRatingHover(0)}>
                    {STARS.map((star) => {
                      const active = star <= (ratingHover || data.rating.mine || 0);
                      return (
                        <button
                          key={star}
                          onClick={() => handleRate(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          aria-label={`${star} estrelas`}
                          className={active ? "text-mustard-500" : "text-muted"}
                        >
                          <StarIcon className="h-7 w-7" filled={active} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                data.rating.count > 0 && (
                  <div className="mt-1 flex gap-0.5 text-mustard-500">
                    {STARS.map((star) => (
                      <StarIcon
                        key={star}
                        className="h-4 w-4"
                        filled={star <= Math.round(data.rating.average)}
                      />
                    ))}
                  </div>
                )
              )}

              {!data.isLoggedIn && (
                <p className="mt-2 text-xs text-muted">
                  <Link to="/login" className="text-primary-600 underline">
                    Entre
                  </Link>{" "}
                  para avaliar, comentar e salvar.
                </p>
              )}
            </div>

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

            {/* Comentários */}
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Comentários ({data.comments.length})
              </p>

              {canInteract && (
                <form onSubmit={handlePostComment} className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Deixe um comentário"
                    maxLength={1000}
                    className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={postingComment || !commentText.trim()}
                    className="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                </form>
              )}

              {data.comments.length === 0 ? (
                <p className="text-sm text-muted">Nenhum comentário ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {data.comments.map((comment) => (
                    <li key={comment._id} className="rounded-lg bg-surface-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{comment.authorName}</p>
                        {comment.mine && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-xs text-rust-600"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">{comment.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
