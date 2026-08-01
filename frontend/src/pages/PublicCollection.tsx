import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_URL } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { tagLabel } from "../lib/labels";
import { MenuIcon } from "../components/icons";
import { BowlIllustration, EmptyShelfIllustration } from "../components/illustrations";
import { EmptyState } from "../components/ui/EmptyState";
import { PhotoOrFallback } from "../components/ui/PhotoOrFallback";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { Footer } from "../components/layout/Footer";

type PublicCollectionData = {
  _id: string;
  name: string;
  authorName: string | null;
  recipes: {
    _id: string;
    name: string;
    imageUrl?: string;
    category?: string;
    prepTime?: number;
  }[];
};

export function PublicCollection() {
  const { id } = useParams();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<PublicCollectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/public/collections/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex min-h-svh flex-col lg:pl-20">
      <Header
        left={
          <button onClick={() => setSidebarOpen(true)} aria-label={t.nav.openMenu} className="text-muted lg:hidden">
            <MenuIcon className="h-6 w-6" />
          </button>
        }
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-sm text-muted">{t.common.loading}</p>
        ) : !data ? (
          <EmptyState
            illustration={<EmptyShelfIllustration />}
            title={t.collections.notFoundTitle}
            description={t.collections.notFoundDesc}
          />
        ) : (
          <>
            <div>
              <h1 className="font-display text-2xl font-semibold">{data.name}</h1>
              {data.authorName && (
                <p className="mt-0.5 text-sm text-muted">{t.collections.by(data.authorName)}</p>
              )}
            </div>

            {data.recipes.length === 0 ? (
              <EmptyState
                illustration={<BowlIllustration className="h-20 w-auto" />}
                title={t.collections.emptyCollectionTitle}
                description={t.collections.subtitle}
              />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.recipes.map((r) => (
                  <li key={r._id}>
                    <Link
                      to={`/receita/${r._id}`}
                      className="block overflow-hidden rounded-lg border border-line"
                    >
                      <PhotoOrFallback
                        src={r.imageUrl}
                        imgClassName="h-40 w-full object-cover"
                        fallback={
                          <div className="flex h-28 w-full items-center justify-center bg-mustard-100 dark:bg-mustard-900/30">
                            <BowlIllustration className="h-16 w-auto" />
                          </div>
                        }
                      />
                      <div className="space-y-1 p-3">
                        <p className="truncate font-medium">{r.name}</p>
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted">
                          {r.category && <span>{tagLabel(t, r.category)}</span>}
                          {r.prepTime != null && <span>{r.prepTime} {t.units.min}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
