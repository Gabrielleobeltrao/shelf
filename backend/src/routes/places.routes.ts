import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Place } from "../models/Place.js";
import { CheckIn } from "../models/CheckIn.js";
import { SavedPlace } from "../models/SavedPlace.js";
import { listUsers } from "../lib/profiles.js";

const router = Router();
router.use(requireAuth);

type PlaceDoc = InstanceType<typeof Place>;

// Top tag keys by vote count (aggregated on the place from check-ins).
function topTags(tagCounts: unknown, n = 3): string[] {
  if (!tagCounts || typeof tagCounts !== "object") return [];
  return Object.entries(tagCounts as Record<string, number>)
    .filter(([, c]) => Number(c) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, n)
    .map(([k]) => k);
}

function serializePlace(p: PlaceDoc) {
  const count = p.ratingCount;
  return {
    id: String(p._id),
    name: p.name,
    address: p.address,
    city: p.city,
    state: p.state,
    country: p.country,
    description: p.description,
    imageUrl: p.imageUrl,
    geo: p.geo,
    categories: p.categories,
    rating: count > 0 ? Math.round((p.ratingSum / count) * 10) / 10 : null,
    ratingCount: count,
    price: p.priceCount > 0 ? Math.round(p.priceSum / p.priceCount) : null,
    tags: topTags(p.tagCounts),
  };
}

// Search places by name (for the check-in flow).
router.get("/", async (req, res) => {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const q = String(req.query.q ?? "").trim();
  const city = String(req.query.city ?? "").trim();
  const country = String(req.query.country ?? "").trim();
  const state = String(req.query.state ?? "").trim();
  const filter: Record<string, unknown> = {};
  if (q) filter.name = new RegExp(esc(q), "i");
  if (city) filter.city = new RegExp(esc(city), "i");
  if (country) filter.country = country;
  if (state) filter.state = state;

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
        state: d.state,
        country: d.country,
        description: d.description,
        imageUrl: d.imageUrl,
        geo: d.geo,
        categories: d.categories,
        rating: d.ratingCount > 0 ? Math.round((d.ratingSum / d.ratingCount) * 10) / 10 : null,
        ratingCount: d.ratingCount,
        price: d.priceCount > 0 ? Math.round(d.priceSum / d.priceCount) : null,
        tags: topTags(d.tagCounts),
      })),
    );
    return;
  }

  const places = await Place.find(filter).sort({ ratingCount: -1, createdAt: -1 }).limit(30);
  res.json(places.map(serializePlace));
});

// Create a place (used when it doesn't exist yet).
router.post("/", async (req, res) => {
  const { name, address, city, state, country, geo, categories, description, imageUrl } = req.body ?? {};
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: "Nome obrigatório" });
    return;
  }
  const place = await Place.create({
    name: String(name).trim().slice(0, 120),
    address: address ? String(address).slice(0, 200) : undefined,
    city: city ? String(city).slice(0, 80) : undefined,
    state: state ? String(state).slice(0, 80) : undefined,
    country: country ? String(country).slice(0, 80) : undefined,
    description: description ? String(description).slice(0, 500) : "",
    imageUrl: imageUrl ? String(imageUrl).slice(0, 500) : undefined,
    geo: geo?.lat != null && geo?.lng != null ? { lat: geo.lat, lng: geo.lng } : undefined,
    categories: Array.isArray(categories) ? categories.slice(0, 6).map((c) => String(c)) : [],
    createdBy: req.userId,
  });
  res.status(201).json(serializePlace(place));
});

// Distinct country/state pairs (for the region filters). Before /:id.
router.get("/regions", async (_req, res) => {
  const rows = await Place.aggregate([
    { $match: { country: { $nin: [null, ""] } } },
    {
      $group: {
        _id: { country: "$country", state: { $ifNull: ["$state", ""] } },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  res.json(
    rows.map((r) => ({ country: r._id.country, state: r._id.state || null, count: r.count })),
  );
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
