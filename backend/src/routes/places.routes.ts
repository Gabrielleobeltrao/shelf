import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Place } from "../models/Place.js";
import { CheckIn } from "../models/CheckIn.js";
import { SavedPlace } from "../models/SavedPlace.js";
import { listUsers } from "../lib/profiles.js";

const router = Router();
router.use(requireAuth);

type PlaceDoc = InstanceType<typeof Place>;
function serializePlace(p: PlaceDoc) {
  const count = p.ratingCount;
  return {
    id: String(p._id),
    name: p.name,
    address: p.address,
    city: p.city,
    geo: p.geo,
    categories: p.categories,
    rating: count > 0 ? Math.round((p.ratingSum / count) * 10) / 10 : null,
    ratingCount: count,
  };
}

// Search places by name (for the check-in flow).
router.get("/", async (req, res) => {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const q = String(req.query.q ?? "").trim();
  const city = String(req.query.city ?? "").trim();
  const filter: Record<string, unknown> = {};
  if (q) filter.name = new RegExp(esc(q), "i");
  if (city) filter.city = new RegExp(esc(city), "i");

  // Ranking by average rating (rated places first) vs. default popularity.
  if (req.query.sort === "rating") {
    const docs = await Place.aggregate([
      { $match: filter },
      {
        $addFields: {
          avg: { $cond: [{ $gt: ["$ratingCount", 0] }, { $divide: ["$ratingSum", "$ratingCount"] }, -1] },
        },
      },
      { $sort: { avg: -1, ratingCount: -1 } },
      { $limit: 30 },
    ]);
    res.json(
      docs.map((d) => ({
        id: String(d._id),
        name: d.name,
        address: d.address,
        city: d.city,
        geo: d.geo,
        rating: d.ratingCount > 0 ? Math.round((d.ratingSum / d.ratingCount) * 10) / 10 : null,
        ratingCount: d.ratingCount,
      })),
    );
    return;
  }

  const places = await Place.find(filter).sort({ ratingCount: -1, createdAt: -1 }).limit(30);
  res.json(places.map(serializePlace));
});

// Create a place (used when it doesn't exist yet).
router.post("/", async (req, res) => {
  const { name, address, city, geo, categories } = req.body ?? {};
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: "Nome obrigatório" });
    return;
  }
  const place = await Place.create({
    name: String(name).trim().slice(0, 120),
    address: address ? String(address).slice(0, 200) : undefined,
    city: city ? String(city).slice(0, 80) : undefined,
    geo: geo?.lat != null && geo?.lng != null ? { lat: geo.lat, lng: geo.lng } : undefined,
    categories: Array.isArray(categories) ? categories.slice(0, 6).map((c) => String(c)) : [],
    createdBy: req.userId,
  });
  res.status(201).json(serializePlace(place));
});

// My "want to go" wishlist. Before /:id.
router.get("/saved", async (req, res) => {
  const saved = await SavedPlace.find({ userId: req.userId }).sort({ _id: -1 }).limit(100);
  const byId = new Map(
    (await Place.find({ _id: { $in: saved.map((s) => s.placeId) } })).map((p) => [String(p._id), p]),
  );
  const ordered = saved.map((s) => byId.get(s.placeId)).filter(Boolean) as PlaceDoc[];
  res.json(ordered.map((p) => ({ ...serializePlace(p), savedByMe: true })));
});

router.get("/:id", async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) {
    res.status(404).json({ error: "Lugar não encontrado" });
    return;
  }
  const savedByMe = !!(await SavedPlace.findOne({ userId: req.userId, placeId: String(place._id) }));
  res.json({ ...serializePlace(place), savedByMe });
});

// Save / unsave a place (want to go).
router.post("/:id/save", async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) {
    res.status(404).json({ error: "Lugar não encontrado" });
    return;
  }
  try {
    await SavedPlace.create({ userId: req.userId, placeId: String(place._id) });
  } catch {
    // already saved
  }
  res.json({ savedByMe: true });
});

router.delete("/:id/save", async (req, res) => {
  await SavedPlace.findOneAndDelete({ userId: req.userId, placeId: req.params.id });
  res.json({ savedByMe: false });
});

// Public reviews/check-ins at a place.
router.get("/:id/checkins", async (req, res) => {
  const checkins = await CheckIn.find({ placeId: req.params.id, visibility: "public" })
    .sort({ createdAt: -1 })
    .limit(50);
  const users = new Map((await listUsers(checkins.map((c) => c.userId))).map((u) => [u.userId, u]));
  res.json(
    checkins.map((c) => ({
      id: String(c._id),
      user: users.get(c.userId),
      rating: c.rating,
      review: c.review,
      dish: c.dish,
      photos: c.photos,
      createdAt: c.get("createdAt"),
    })),
  );
});

export default router;
