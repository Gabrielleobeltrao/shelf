import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { Recipe } from "../models/Recipe.js";
import { RecipeRating } from "../models/RecipeRating.js";
import { RecipeComment } from "../models/RecipeComment.js";
import { RecipeCook } from "../models/RecipeCook.js";
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

const PAGE_SIZE = 24;

// Public, unauthenticated recipe browse/search. Lists every public recipe
// (across all users) with its rating summary, author name, and comment
// count, filterable by tag and searchable by name.
router.get("/", async (req, res) => {
  const term = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
  const page = Math.max(1, Number(req.query.page) || 1);

  const filter: Record<string, unknown> = { isPublic: true };
  if (tag) filter.category = tag;
  if (term) filter.name = { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  const total = await Recipe.countDocuments(filter);
  const recipes = await Recipe.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  // Batch the per-recipe extras instead of N queries each.
  const recipeIds = recipes.map((r) => r.id);
  const authorIds = [...new Set(recipes.map((r) => r.userId))];

  const [ratings, commentCounts, cookedCounts, savedCounts, authors] = await Promise.all([
    RecipeRating.find({ recipeId: { $in: recipeIds } }),
    RecipeComment.aggregate<{ _id: string; count: number }>([
      { $match: { recipeId: { $in: recipeIds } } },
      { $group: { _id: "$recipeId", count: { $sum: 1 } } },
    ]),
    RecipeCook.aggregate<{ _id: string; count: number }>([
      { $match: { recipeId: { $in: recipeIds } } },
      { $group: { _id: "$recipeId", count: { $sum: 1 } } },
    ]),
    // How many people saved each recipe = copies pointing back to it.
    Recipe.aggregate<{ _id: string; count: number }>([
      { $match: { savedFrom: { $in: recipeIds } } },
      { $group: { _id: "$savedFrom", count: { $sum: 1 } } },
    ]),
    mongoose.connection
      .db!.collection("user")
      .find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } })
      .toArray(),
  ]);

  const ratingByRecipe = new Map<string, { sum: number; count: number }>();
  for (const r of ratings) {
    const acc = ratingByRecipe.get(r.recipeId) ?? { sum: 0, count: 0 };
    acc.sum += r.stars;
    acc.count += 1;
    ratingByRecipe.set(r.recipeId, acc);
  }
  const commentCountByRecipe = new Map(commentCounts.map((c) => [c._id, c.count]));
  const cookedCountByRecipe = new Map(cookedCounts.map((c) => [c._id, c.count]));
  const savedCountByRecipe = new Map(savedCounts.map((c) => [c._id, c.count]));
  const authorNameById = new Map(authors.map((a) => [a._id.toString(), a.name as string]));

  res.json({
    recipes: recipes.map((recipe) => {
      const agg = ratingByRecipe.get(recipe.id);
      return {
        _id: recipe._id,
        name: recipe.name,
        category: recipe.category,
        prepTime: recipe.prepTime,
        servings: recipe.servings,
        imageUrl: recipe.imageUrl,
        authorName: authorNameById.get(recipe.userId) ?? null,
        rating: {
          average: agg ? agg.sum / agg.count : 0,
          count: agg?.count ?? 0,
        },
        commentCount: commentCountByRecipe.get(recipe.id) ?? 0,
        cookedCount: cookedCountByRecipe.get(recipe.id) ?? 0,
        savedCount: savedCountByRecipe.get(recipe.id) ?? 0,
      };
    }),
    hasMore: page * PAGE_SIZE < total,
    total,
  });
});

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

  const [rating, comments, alreadySaved, cookedCount, savedCount, cookedByViewer] = await Promise.all([
    ratingSummary(recipe.id, viewer?.id ?? null),
    RecipeComment.find({ recipeId: recipe.id }).sort({ createdAt: -1 }),
    viewer && !isOwner
      ? Recipe.exists({ userId: viewer.id, savedFrom: recipe.id })
      : Promise.resolve(null),
    RecipeCook.countDocuments({ recipeId: recipe.id }),
    Recipe.countDocuments({ savedFrom: recipe.id }),
    viewer ? RecipeCook.exists({ recipeId: recipe.id, userId: viewer.id }) : Promise.resolve(null),
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
    cookedCount,
    savedCount,
    cooked: !!cookedByViewer,
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

// "I made this" — any logged-in user (the owner included) can toggle it.
router.post("/:id/cooked", async (req, res) => {
  const viewer = await getViewer(req);
  if (!viewer) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "Receita não encontrada" });
    return;
  }
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe || !recipe.isPublic) {
    res.status(404).json({ error: "Receita não encontrada" });
    return;
  }

  const existing = await RecipeCook.findOne({ recipeId: recipe.id, userId: viewer.id });
  let cooked: boolean;
  if (existing) {
    await RecipeCook.deleteOne({ _id: existing._id });
    cooked = false;
  } else {
    // upsert guards a double-tap race against the unique index.
    await RecipeCook.updateOne(
      { recipeId: recipe.id, userId: viewer.id },
      { $setOnInsert: { recipeId: recipe.id, userId: viewer.id } },
      { upsert: true },
    );
    cooked = true;
  }

  const count = await RecipeCook.countDocuments({ recipeId: recipe.id });
  res.json({ cooked, count });
});

export default router;
