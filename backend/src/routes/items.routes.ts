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
  const { name, quantity, unit, category, brand, packageSize, imageUrl, barcode } = req.body;
  const item = await Item.create({
    name,
    quantity,
    unit,
    category,
    brand,
    packageSize,
    imageUrl,
    barcode,
    userId: req.userId,
  });
  res.status(201).json(item);
});

router.patch("/:id", async (req, res) => {
  const { name, quantity, unit, category, brand, packageSize, imageUrl, barcode } = req.body;
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { name, quantity, unit, category, brand, packageSize, imageUrl, barcode } },
    { new: true, omitUndefined: true },
  );

  if (!item) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  res.json(item);
});

router.delete("/:id", async (req, res) => {
  await Item.deleteOne({ _id: req.params.id, userId: req.userId });
  res.status(204).end();
});

export default router;
