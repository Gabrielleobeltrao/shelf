import "dotenv/config";
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { connectDB } from "./config/db.js";
import { getAllowedOrigins } from "./config/origins.js";
import itemsRouter from "./routes/items.routes.js";
import recipesRouter from "./routes/recipes.routes.js";
import settingsRouter from "./routes/settings.routes.js";
import shoppingListRouter from "./routes/shopping-list.routes.js";
import productSearchRouter from "./routes/product-search.routes.js";

const app = express();
const PORT = process.env.PORT ?? 4001;

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Better Auth precisa ler o corpo bruto da requisição, então é montado
// antes do express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/items", itemsRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/shopping-list", shoppingListRouter);
app.use("/api/product-search", productSearchRouter);

await connectDB();

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
