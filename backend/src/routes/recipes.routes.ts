import { Router } from "express";
import { Recipe } from "../models/Recipe.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const recipes = await Recipe.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(recipes);
});

router.post("/", async (req, res) => {
  const { name, ingredients, instructions } = req.body;
  const recipe = await Recipe.create({
    name,
    ingredients,
    instructions,
    userId: req.userId,
  });
  res.status(201).json(recipe);
});

router.patch("/:id", async (req, res) => {
  const { name, ingredients, instructions } = req.body;
  const recipe = await Recipe.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { name, ingredients, instructions } },
    { new: true, omitUndefined: true },
  );

  if (!recipe) {
    res.status(404).json({ error: "Receita não encontrada" });
    return;
  }

  res.json(recipe);
});

router.delete("/:id", async (req, res) => {
  await Recipe.deleteOne({ _id: req.params.id, userId: req.userId });
  res.status(204).end();
});

export default router;
