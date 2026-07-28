import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { Recipe } from "../models/Recipe.js";
import { RecipeRating } from "../models/RecipeRating.js";
import { RecipeComment } from "../models/RecipeComment.js";
import { auth } from "../config/auth.js";

const router = Router();

async function getViewer(req: { headers: Record<string, unknown> }) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers as never) });
  return session?.user ?? null;
}

async function ratingSummary(recipeId: string, viewerId: string | null) {
  const ratings = await RecipeRating.find({ recipeId });
  const count = ratings.length;
  const average = count === 0 ? 0 : ratings.reduce((sum, r) => sum + r.stars, 0) / count;
  const mine = viewerId ? (ratings.find((r) => r.userId === viewerId)?.stars ?? null) : null;
  return { average, count, mine };
}

// Deliberately unauthenticated GET: a public recipe page is meant to be
// shareable with anyone by link. The session is still read (when present)
// so the page can tell the owner apart and personalize interactions.
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "Receita não encontrada" });
    return;
  }

  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) {
    res.status(404).json({ error: "Receita não encontrada" });
    return;
  }

  const viewer = await getViewer(req);
  const isOwner = viewer?.id === recipe.userId;

  // Private recipes 404 for everyone but the owner — same response as a
  // missing id, so the URL doesn't reveal that a hidden recipe exists.
  if (!recipe.isPublic && !isOwner) {
    res.status(404).json({ error: "Receita não encontrada" });
    return;
  }

  const author = await mongoose.connection
    .db!.collection("user")
    .findOne({ _id: new ObjectId(recipe.userId) });

  const steps =
    recipe.steps.length > 0
      ? recipe.steps
      : (recipe.instructions ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

  const [rating, comments, alreadySaved] = await Promise.all([
    ratingSummary(recipe.id, viewer?.id ?? null),
    RecipeComment.find({ recipeId: recipe.id }).sort({ createdAt: -1 }),
    viewer && !isOwner
      ? Recipe.exists({ userId: viewer.id, savedFrom: recipe.id })
      : Promise.resolve(null),
  ]);

  res.json({
    recipe: {
      _id: recipe._id,
      name: recipe.name,
      category: recipe.category,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients.map((row) => ({
        name: row.name,
        quantity: row.quantity,
        unit: row.unit,
      })),
      steps,
      isPublic: recipe.isPublic,
    },
    authorName: author?.name ?? null,
    isOwner,
    isLoggedIn: !!viewer,
    rating,
    comments: comments.map((c) => ({
      _id: c._id,
      authorName: c.authorName,
      text: c.text,
      createdAt: c.createdAt,
      mine: viewer?.id === c.userId,
    })),
    saved: !!alreadySaved,
  });
});

// --- Authenticated interactions (require an account) ---

// Loads a public recipe the viewer is allowed to interact with (not their
// own), or sends the appropriate error and returns null.
async function loadInteractable(
  req: { headers: Record<string, unknown>; params: { id: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  const viewer = await getViewer(req);
  if (!viewer) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "Receita não encontrada" });
    return null;
  }
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe || !recipe.isPublic) {
    res.status(404).json({ error: "Receita não encontrada" });
    return null;
  }
  if (recipe.userId === viewer.id) {
    res.status(400).json({ error: "Você não pode interagir com a própria receita" });
    return null;
  }
  return { viewer, recipe };
}

router.put("/:id/rating", async (req, res) => {
  const ctx = await loadInteractable(req, res);
  if (!ctx) return;

  const stars = Number(req.body?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 6) {
    res.status(400).json({ error: "Avaliação inválida" });
    return;
  }

  await RecipeRating.findOneAndUpdate(
    { recipeId: ctx.recipe.id, userId: ctx.viewer.id },
    { $set: { stars } },
    { upsert: true },
  );

  res.json(await ratingSummary(ctx.recipe.id, ctx.viewer.id));
});

router.post("/:id/comments", async (req, res) => {
  const ctx = await loadInteractable(req, res);
  if (!ctx) return;

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    res.status(400).json({ error: "Comentário vazio" });
    return;
  }

  const comment = await RecipeComment.create({
    recipeId: ctx.recipe.id,
    userId: ctx.viewer.id,
    authorName: ctx.viewer.name || "Anônimo",
    text: text.slice(0, 1000),
  });

  res.status(201).json({
    _id: comment._id,
    authorName: comment.authorName,
    text: comment.text,
    createdAt: comment.createdAt,
    mine: true,
  });
});

router.delete("/:id/comments/:commentId", async (req, res) => {
  const viewer = await getViewer(req);
  if (!viewer) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  // A user can only delete their own comment.
  await RecipeComment.deleteOne({ _id: req.params.commentId, userId: viewer.id });
  res.status(204).end();
});

router.post("/:id/save", async (req, res) => {
  const ctx = await loadInteractable(req, res);
  if (!ctx) return;

  const existing = await Recipe.findOne({ userId: ctx.viewer.id, savedFrom: ctx.recipe.id });
  if (existing) {
    res.json({ saved: true, recipeId: existing._id });
    return;
  }

  // Copy presentation data into the viewer's own (private) list. Strip
  // itemId from ingredients — those referenced the original owner's stock.
  const copy = await Recipe.create({
    name: ctx.recipe.name,
    ingredients: ctx.recipe.ingredients.map((row) => ({
      name: row.name,
      quantity: row.quantity,
      unit: row.unit,
    })),
    steps:
      ctx.recipe.steps.length > 0
        ? ctx.recipe.steps
        : (ctx.recipe.instructions ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
    prepTime: ctx.recipe.prepTime,
    servings: ctx.recipe.servings,
    category: ctx.recipe.category,
    imageUrl: ctx.recipe.imageUrl,
    isPublic: false,
    savedFrom: ctx.recipe.id,
    userId: ctx.viewer.id,
  });

  res.status(201).json({ saved: true, recipeId: copy._id });
});

export default router;
