// CLIENT_URL supports a comma-separated list so the same backend can allow
// both the production frontend and a local dev frontend at once (e.g.
// CLIENT_URL="https://shelf.oneplataforma.com,http://localhost:5183").
// Falls back to the local dev port when unset.
export function getAllowedOrigins(): string[] {
  const raw = process.env.CLIENT_URL;
  if (!raw) return ["http://localhost:5183"];

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
