import { Router } from "express";
import { Item } from "../models/Item.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { withHousehold } from "../middleware/withHousehold.js";
import { publish } from "../lib/householdBus.js";
import { logActivity } from "../lib/householdActivity.js";

const router = Router();

router.use(requireAuth);
router.use(withHousehold);

router.get("/", async (req, res) => {
  const items = await Item.find({ householdId: req.householdId }).sort({ createdAt: -1 });
  res.json(items);
});

router.post("/", async (req, res) => {
  const {
    name,
    quantity,
    unit,
    category,
    location,
    brand,
    packageSize,
    imageUrl,
    barcode,
    expirationDate,
    nutrition,
    glutenFree,
    vegan,
  } = req.body;
  const item = await Item.create({
    name,
    quantity,
    unit,
    category,
    location,
    brand,
    packageSize,
    imageUrl,
    barcode,
    expirationDate,
    nutrition,
    glutenFree,
    vegan,
    householdId: req.householdId,
    userId: req.userId,
  });
  publish(req.householdId, "items");
  logActivity(req.householdId, req.userId, "item_added", item.name);
  res.status(201).json(item);
});

router.patch("/:id", async (req, res) => {
  const {
    name,
    quantity,
    unit,
    category,
    location,
    brand,
    packageSize,
    imageUrl,
    barcode,
    expirationDate,
    nutrition,
    glutenFree,
    vegan,
  } = req.body;
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, householdId: req.householdId },
    {
      $set: {
        name,
        quantity,
        unit,
        category,
        location,
        brand,
        packageSize,
        imageUrl,
        barcode,
        expirationDate,
        nutrition,
        glutenFree,
        vegan,
      },
    },
    { new: true, omitUndefined: true },
  );

  if (!item) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  publish(req.householdId, "items");
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  const item = await Item.findOneAndDelete({ _id: req.params.id, householdId: req.householdId });
  if (item) {
    publish(req.householdId, "items");
    logActivity(req.householdId, req.userId, "item_removed", item.name);
  }
  res.status(204).end();
});

export default router;
