import { Router } from "express";
import { Item } from "../models/Item.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await Item.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(items);
});

router.post("/", async (req, res) => {
  const { name, quantity, unit, category } = req.body;
  const item = await Item.create({ name, quantity, unit, category, userId: req.userId });
  res.status(201).json(item);
});

router.delete("/:id", async (req, res) => {
  await Item.deleteOne({ _id: req.params.id, userId: req.userId });
  res.status(204).end();
});

export default router;
