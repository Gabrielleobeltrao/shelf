import { Router } from "express";
import mongoose from "mongoose";
import { RecipeCollection } from "../models/RecipeCollection.js";
import { Recipe } from "../models/Recipe.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

type RecipeDoc = {
  _id: unknown;
  name: string;
  imageUrl?: string;
  category?: string;
  prepTime?: number;
  servings?: number;
  isPublic?: boolean;
  savedFrom?: string;
};

function toSummary(r: RecipeDoc) {
  return {
    _id: r._id,
    name: r.name,
    imageUrl: r.imageUrl,
    category: r.category,
    prepTime: r.prepTime,
    servings: r.servings,
    isPublic: r.isPublic,
    savedFrom: r.savedFrom,
  };
}

// List the user's collections with membership ids and a few cover images.
router.get("/", async (req, res) => {
  const collections = await RecipeCollection.find({ userId: req.userId }).sort({ createdAt: -1 });

  const allIds = [...new Set(collections.flatMap((c) => c.recipeIds))];
  const recipes = await Recipe.find({ _id: { $in: allIds }, userId: req.userId });
  const imageById = new Map(recipes.map((r) => [r.id, r.imageUrl as string | undefined]));

  res.json(
    collections.map((c) => ({
      _id: c._id,
      name: c.name,
      isPublic: c.isPublic,
      recipeIds: c.recipeIds,
      covers: c.recipeIds
        .map((id) => imageById.get(id))
        .filter((url): url is string => !!url)
        .slice(0, 4),
    })),
  );
});

router.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "Nome obrigatório" });
    return;
  }
  const collection = await RecipeCollection.create({ name: name.slice(0, 80), userId: req.userId });
  res.status(201).json({ _id: collection._id, name: collection.name, isPublic: collection.isPublic, recipeIds: [] });
});

// Owner view of a collection, with its recipes in order.
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "Coleção não encontrada" });
    return;
  }
  const collection = await RecipeCollection.findOne({ _id: req.params.id, userId: req.userId });
  if (!collection) {
    res.status(404).json({ error: "Coleção não encontrada" });
    return;
  }

  const recipes = await Recipe.find({ _id: { $in: collection.recipeIds }, userId: req.userId });
  const byId = new Map(recipes.map((r) => [r.id, r]));
  // Preserve the collection's order; drop ids whose recipe no longer exists.
  const ordered = collection.recipeIds.map((id) => byId.get(id)).filter(Boolean) as RecipeDoc[];

  res.json({
    _id: collection._id,
    name: collection.name,
    isPublic: collection.isPublic,
    recipes: ordered.map(toSummary),
  });
});

router.patch("/:id", async (req, res) => {
  const update: Record<string, unknown> = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) {
    update.name = req.body.name.trim().slice(0, 80);
  }
  if (typeof req.body?.isPublic === "boolean") {
    update.isPublic = req.body.isPublic;
  }

  const collection = await RecipeCollection.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: update },
    { new: true },
  );
  if (!collection) {
    res.status(404).json({ error: "Coleção não encontrada" });
    return;
  }
  res.json({ _id: collection._id, name: collection.name, isPublic: collection.isPublic });
});

router.delete("/:id", async (req, res) => {
  await RecipeCollection.deleteOne({ _id: req.params.id, userId: req.userId });
  res.status(204).end();
});

router.post("/:id/recipes", async (req, res) => {
  const recipeId = typeof req.body?.recipeId === "string" ? req.body.recipeId : "";
  // Only the user's own recipes can be added.
  const owns = await Recipe.exists({ _id: recipeId, userId: req.userId });
  if (!owns) {
    res.status(400).json({ error: "Receita inválida" });
    return;
  }
  const collection = await RecipeCollection.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $addToSet: { recipeIds: recipeId } },
    { new: true },
  );
  if (!collection) {
    res.status(404).json({ error: "Coleção não encontrada" });
    return;
  }
  res.json({ ok: true, recipeIds: collection.recipeIds });
});

router.delete("/:id/recipes/:recipeId", async (req, res) => {
  const collection = await RecipeCollection.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $pull: { recipeIds: req.params.recipeId } },
    { new: true },
  );
  if (!collection) {
    res.status(404).json({ error: "Coleção não encontrada" });
    return;
  }
  res.json({ ok: true, recipeIds: collection.recipeIds });
});

export default router;
