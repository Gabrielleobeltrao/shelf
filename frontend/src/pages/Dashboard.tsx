import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { daysUntil, getExpirationWarning } from "../lib/expiration";

type Item = {
  _id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  expirationDate?: string;
};

export function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [trackExpiration, setTrackExpiration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Item[]>("/api/items"),
      api.get<{ trackExpiration: boolean }>("/api/settings"),
    ])
      .then(([itemsData, settings]) => {
        setItems(itemsData);
        setTrackExpiration(settings.trackExpiration);
      })
      .finally(() => setLoading(false));
  }, []);

  const expiringSoon = items
    .filter((item) => item.expirationDate)
    .filter((item) => daysUntil(item.expirationDate!) <= 7)
    .sort((a, b) => daysUntil(a.expirationDate!) - daysUntil(b.expirationDate!));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">Vencendo em breve</h2>

        {!trackExpiration ? (
          <p className="text-sm text-gray-500">
            Ative o controle de validade em{" "}
            <Link to="/configuracoes" className="text-emerald-600 underline">
              Configurações
            </Link>{" "}
            pra acompanhar aqui.
          </p>
        ) : loading ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : expiringSoon.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum produto vencendo em breve.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {expiringSoon.map((item) => (
              <li key={item._id} className="flex items-center gap-3 py-2">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate">{item.name}</p>
                  {item.brand && <p className="truncate text-xs text-gray-500">{item.brand}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                  {getExpirationWarning(item.expirationDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
