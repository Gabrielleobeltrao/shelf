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
import publicRecipesRouter from "./routes/public-recipes.routes.js";
import roadmapRouter from "./routes/roadmap.routes.js";
import collectionsRouter from "./routes/collections.routes.js";
import publicCollectionsRouter from "./routes/public-collections.routes.js";
import householdRouter from "./routes/household.routes.js";
import profileRouter from "./routes/profile.routes.js";
import followRouter from "./routes/follow.routes.js";
import postsRouter from "./routes/posts.routes.js";
import feedRouter from "./routes/feed.routes.js";
import placesRouter from "./routes/places.routes.js";
import checkinsRouter from "./routes/checkins.routes.js";
import notificationsRouter from "./routes/notifications.routes.js";

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
app.use("/api/public/recipes", publicRecipesRouter);
app.use("/api/roadmap", roadmapRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/public/collections", publicCollectionsRouter);
app.use("/api/household", householdRouter);
app.use("/api/profile", profileRouter);
app.use("/api/follow", followRouter);
app.use("/api/posts", postsRouter);
app.use("/api/feed", feedRouter);
app.use("/api/places", placesRouter);
app.use("/api/checkins", checkinsRouter);
app.use("/api/notifications", notificationsRouter);

await connectDB();

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
