import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

const PAGE_SIZE = 40;
const SEARCH_FIELDS = "code,product_name,brands,categories,quantity,image_front_url";
// Same reasoning as the old direct-from-browser client: Open Food Facts is
// prone to intermittent failures, so retry with backoff before giving up.
const RETRY_DELAYS_MS = [400, 900, 1600];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Proxies to Open Food Facts' newer Elasticsearch-backed search
// (search.openfoodfacts.org) instead of the legacy cgi/search.pl, which
// matches loosely across ingredient text and buries the actually relevant
// products. This endpoint doesn't send CORS headers, so it can't be called
// directly from the browser — routed through our own backend instead.
router.get("/", async (req, res) => {
  const term = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const page = Math.max(1, Number(req.query.page) || 1);

  const url = new URL("https://search.openfoodfacts.org/search");
  if (term) {
    url.searchParams.set("q", term);
  } else {
    url.searchParams.set("sort_by", "popularity_key");
  }
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("fields", SEARCH_FIELDS);

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const offRes = await fetch(url);
      if (offRes.ok) {
        const data = await offRes.json();
        res.json(data);
        return;
      }
    } catch {
      // fall through to retry
    }

    if (attempt < RETRY_DELAYS_MS.length) await wait(RETRY_DELAYS_MS[attempt]);
  }

  res.status(502).json({ error: true });
});

export default router;
