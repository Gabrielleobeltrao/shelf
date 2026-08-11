import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { CheckIn } from "../models/CheckIn.js";
import { Place } from "../models/Place.js";
import { Post } from "../models/Post.js";
import { PostLike } from "../models/PostLike.js";
import { PostComment } from "../models/PostComment.js";
import { Profile } from "../models/Profile.js";
import { getOrCreateProfile } from "../lib/profiles.js";
import { extractTags } from "../lib/posts.js";

const router = Router();
router.use(requireAuth);

const VIS = ["public", "followers", "private"];

// Check in at a place. Accepts an existing placeId or a `place` object to
// create on the fly. Spawns a feed Post and updates the place's rating.
router.post("/", async (req, res) => {
  const me = req.userId!;
  const { placeId, place, rating, priceLevel, review, dish, photos, visibility } = req.body ?? {};

  let resolvedPlaceId = placeId ? String(placeId) : "";
  if (!resolvedPlaceId) {
    if (!place?.name) {
      res.status(400).json({ error: "Informe um lugar" });
      return;
    }
    const created = await Place.create({
      name: String(place.name).trim().slice(0, 120),
      city: place.city ? String(place.city).slice(0, 80) : undefined,
      address: place.address ? String(place.address).slice(0, 200) : undefined,
      geo: place.geo?.lat != null && place.geo?.lng != null ? { lat: place.geo.lat, lng: place.geo.lng } : undefined,
      createdBy: me,
    });
    resolvedPlaceId = String(created._id);
  } else if (!(await Place.findById(resolvedPlaceId))) {
    res.status(404).json({ error: "Lugar não encontrado" });
    return;
  }

  const vis = VIS.includes(visibility) ? visibility : "public";
  const numRating = rating != null ? Math.max(1, Math.min(6, Number(rating))) : undefined;
  const numPrice = priceLevel != null ? Math.max(1, Math.min(4, Number(priceLevel))) : undefined;

  await getOrCreateProfile(me);
  const checkin = await CheckIn.create({
    userId: me,
    placeId: resolvedPlaceId,
    rating: numRating,
    priceLevel: numPrice,
    review: String(review ?? "").slice(0, 2000),
    dish: String(dish ?? "").slice(0, 120),
    photos: Array.isArray(photos) ? photos.slice(0, 6).map((p) => String(p)) : [],
    visibility: vis,
  });

  const post = await Post.create({
    authorId: me,
    type: numRating || review ? "review" : "checkin",
    visibility: vis,
    text: String(review ?? "").slice(0, 2000),
    photos: checkin.photos,
    refs: { placeId: resolvedPlaceId, checkinId: String(checkin._id) },
    tags: extractTags(String(review ?? "")),
  });
  checkin.postId = String(post._id);
  await checkin.save();
  await Profile.updateOne({ userId: me }, { $inc: { postsCount: 1 } });

  if (numRating || numPrice) {
    await Place.updateOne(
      { _id: resolvedPlaceId },
      {
        $inc: {
          ...(numRating ? { ratingSum: numRating, ratingCount: 1 } : {}),
          ...(numPrice ? { priceSum: numPrice, priceCount: 1 } : {}),
        },
      },
    );
  }

  res.status(201).json({ id: String(checkin._id), placeId: resolvedPlaceId, postId: String(post._id) });
});

router.delete("/:id", async (req, res) => {
  const checkin = await CheckIn.findById(req.params.id);
  if (!checkin) {
    res.json({ ok: true });
    return;
  }
  if (checkin.userId !== req.userId) {
    res.status(403).json({ error: "Sem permissão" });
    return;
  }
  await CheckIn.deleteOne({ _id: checkin._id });
  if (checkin.postId) {
    await Promise.all([
      Post.deleteOne({ _id: checkin.postId }),
      PostLike.deleteMany({ postId: checkin.postId }),
      PostComment.deleteMany({ postId: checkin.postId }),
      Profile.updateOne({ userId: req.userId }, { $inc: { postsCount: -1 } }),
    ]);
  }
  if (checkin.rating || checkin.priceLevel) {
    await Place.updateOne(
      { _id: checkin.placeId },
      {
        $inc: {
          ...(checkin.rating ? { ratingSum: -checkin.rating, ratingCount: -1 } : {}),
          ...(checkin.priceLevel ? { priceSum: -checkin.priceLevel, priceCount: -1 } : {}),
        },
      },
    );
  }
  res.json({ ok: true });
});

export default router;
