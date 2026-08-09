import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { social, type PlaceCard, type ReviewView } from "../lib/social";
import { useI18n } from "../lib/i18n";
import { Avatar } from "../components/social/Avatar";
import { StarIcon } from "../components/icons";
import { timeAgo } from "../lib/timeAgo";

export function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={`h-4 w-4 ${n <= Math.round(value) ? "text-mustard-500" : "text-line"}`} />
      ))}
    </span>
  );
}

export function Place() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const [place, setPlace] = useState<PlaceCard | null>(null);
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([social.place(id), social.placeReviews(id)])
      .then(([p, r]) => {
        setPlace(p);
        setReviews(r);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <p className="text-sm text-muted">{t.social.placeNotFound}</p>;
  if (!place) return <p className="text-sm text-muted">{t.common.loading}</p>;

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-16">
      <div>
        <h1 className="font-display text-xl font-bold">📍 {place.name}</h1>
        {place.city && <p className="text-sm text-muted">{place.city}</p>}
        {place.rating != null ? (
          <div className="mt-1 flex items-center gap-2">
            <Stars value={place.rating} />
            <span className="text-sm font-semibold">{place.rating}</span>
            <span className="text-sm text-muted">· {t.social.ratingsCount(place.ratingCount)}</span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">{t.social.noReviews}</p>
        )}
      </div>

      <h2 className="text-sm font-medium text-muted">{t.social.reviews}</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted">{t.social.noReviews}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="space-y-1 rounded-2xl bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <Avatar src={r.user?.avatarUrl} name={r.user?.name || "?"} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {r.user?.name || `@${r.user?.handle ?? ""}`}
                </span>
                {r.rating != null && <Stars value={r.rating} />}
                <span className="shrink-0 text-xs text-muted">{timeAgo(r.createdAt, lang)}</span>
              </div>
              {r.dish && <p className="text-xs text-muted">🍽 {r.dish}</p>}
              {r.review && <p className="text-sm">{r.review}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
