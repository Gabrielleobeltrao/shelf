import { Router } from "express";
import { ShoppingListItem } from "../models/ShoppingListItem.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const entries = await ShoppingListItem.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(entries);
});

router.post("/", async (req, res) => {
  const { name, unit, brand, imageUrl, sourceItemId } = req.body;
  const entry = await ShoppingListItem.create({
    name,
    unit,
    brand,
    imageUrl,
    sourceItemId,
    userId: req.userId,
  });
  res.status(201).json(entry);
});

router.delete("/:id", async (req, res) => {
  await ShoppingListItem.deleteOne({ _id: req.params.id, userId: req.userId });
  res.status(204).end();
});

export default router;
