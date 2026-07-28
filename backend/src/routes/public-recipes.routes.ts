import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { Recipe } from "../models/Recipe.js";
import { auth } from "../config/auth.js";

const router = Router();

// Deliberately unauthenticated: a public recipe page is meant to be
// shareable with anyone by link. The session is still read (when present)
// so the page can tell the owner apart — owners can preview their own
// recipe here even while it's private, and get an edit button.
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

  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  const isOwner = session?.user.id === recipe.userId;

  // Private recipes 404 for everyone but the owner — same response as a
  // missing id, so the URL doesn't reveal that a hidden recipe exists.
  if (!recipe.isPublic && !isOwner) {
    res.status(404).json({ error: "Receita não encontrada" });
    return;
  }

  // Better Auth stores users with ObjectId _id while recipes keep userId
  // as its string form.
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

  // Only presentation data — no userId or stock item references.
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
  });
});

export default router;
