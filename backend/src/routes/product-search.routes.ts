import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

const PAGE_SIZE = 40;
const SEARCH_FIELDS = "code,product_name,brands,categories,quantity,image_front_url";
// Same reasoning as the old direct-from-browser client: Open Food Facts is
// prone to intermittent failures, so retry with backoff before giving up.
const RETRY_DELAYS_MS = [400, 900, 1600];

// Open Food Facts is French-origin, so unfiltered results skew heavily to
// French products (the browse listing is almost entirely French). Scoping to
// the shopper's country — and localising names — makes the picker relevant.
// Keyed by the `cc` the client sends; extend as the app reaches new markets.
const COUNTRIES: Record<string, { tag: string; lang: string }> = {
  br: { tag: "en:brazil", lang: "pt" },
};

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
  const cc = typeof req.query.cc === "string" ? req.query.cc.toLowerCase() : "";
  const country = COUNTRIES[cc];

  const url = new URL("https://search.openfoodfacts.org/search");

  // The q is a Lucene-style query: the free-text term and a country filter,
  // ANDed together. A filter clause alone (browsing) scopes the listing.
  const clauses: string[] = [];
  if (term) clauses.push(term);
  if (country) clauses.push(`countries_tags:"${country.tag}"`);
  if (clauses.length) url.searchParams.set("q", clauses.join(" "));

  if (!term) {
    // Popular-first when browsing. Without a country filter, plain
    // unique_scans_n already lands popular products; with one, the sort only
    // takes effect descending (the minus), else it returns obscure entries.
    url.searchParams.set("sort_by", country ? "-unique_scans_n" : "unique_scans_n");
  }
  if (country) url.searchParams.set("langs", country.lang);

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
