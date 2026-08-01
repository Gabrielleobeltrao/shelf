import { Router } from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { RecipeCollection } from "../models/RecipeCollection.js";
import { Recipe } from "../models/Recipe.js";

const router = Router();

// Public, unauthenticated view of a shared collection. Only public collections
// resolve, and only the public recipes inside them are exposed (private ones
// stay hidden even if the owner added them).
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "Coleção não encontrada" });
    return;
  }

  const collection = await RecipeCollection.findById(req.params.id);
  if (!collection || !collection.isPublic) {
    res.status(404).json({ error: "Coleção não encontrada" });
    return;
  }

  const recipes = await Recipe.find({ _id: { $in: collection.recipeIds }, isPublic: true });
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const ordered = collection.recipeIds.map((id) => byId.get(id)).filter(Boolean);

  const author = await mongoose.connection
    .db!.collection("user")
    .findOne({ _id: new ObjectId(collection.userId) });

  res.json({
    _id: collection._id,
    name: collection.name,
    authorName: author?.name ?? null,
    recipes: ordered.map((r) => ({
      _id: r!._id,
      name: r!.name,
      imageUrl: r!.imageUrl,
      category: r!.category,
      prepTime: r!.prepTime,
      servings: r!.servings,
    })),
  });
});

export default router;
