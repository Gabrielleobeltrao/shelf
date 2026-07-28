import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { useSession } from "./lib/auth-client";
import { useI18n } from "./lib/i18n";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Inventory } from "./pages/Inventory";
import { Recipes } from "./pages/Recipes";
import { Settings } from "./pages/Settings";
import { Dashboard } from "./pages/Dashboard";
import { PublicRecipe } from "./pages/PublicRecipe";
import { ExploreRecipes } from "./pages/ExploreRecipes";
import { Roadmap } from "./pages/Roadmap";

// Root shows the marketing landing to logged-out visitors and sends
// logged-in users straight into the app (Estoque).
function RootRoute() {
  const { data: session, isPending } = useSession();
  const { t } = useI18n();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted">
        {t.common.loading}
      </div>
    );
  }

  return session ? <Navigate to="/estoque" replace /> : <Landing />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Login />} />
      {/* Páginas públicas — acessíveis sem login. */}
      <Route path="/receita/:id" element={<PublicRecipe />} />
      <Route path="/explorar" element={<ExploreRecipes />} />
      <Route path="/roadmap" element={<Roadmap />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/estoque" element={<Inventory />} />
        <Route path="/receitas" element={<Recipes />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
