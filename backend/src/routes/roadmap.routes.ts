import { Router } from "express";
import { RoadmapVote } from "../models/RoadmapVote.js";

const router = Router();

// Public: vote counts per feature, plus which features this device voted for.
router.get("/votes", async (req, res) => {
  const voterKey = typeof req.query.voterKey === "string" ? req.query.voterKey : "";

  const [counts, mine] = await Promise.all([
    RoadmapVote.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$featureId", count: { $sum: 1 } } },
    ]),
    voterKey ? RoadmapVote.find({ voterKey }).select("featureId") : Promise.resolve([]),
  ]);

  res.json({
    counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
    voted: mine.map((v) => v.featureId),
  });
});

// Public: toggle this device's vote for a feature.
router.post("/votes/:featureId", async (req, res) => {
  const featureId = req.params.featureId;
  const voterKey = typeof req.body?.voterKey === "string" ? req.body.voterKey.trim() : "";
  if (!voterKey) {
    res.status(400).json({ error: "voterKey ausente" });
    return;
  }

  const existing = await RoadmapVote.findOne({ featureId, voterKey });
  let voted: boolean;
  if (existing) {
    await RoadmapVote.deleteOne({ _id: existing._id });
    voted = false;
  } else {
    // upsert guards a double-click race against the unique index.
    await RoadmapVote.updateOne(
      { featureId, voterKey },
      { $setOnInsert: { featureId, voterKey } },
      { upsert: true },
    );
    voted = true;
  }

  const count = await RoadmapVote.countDocuments({ featureId });
  res.json({ featureId, count, voted });
});

export default router;
