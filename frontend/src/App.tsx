import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/Login";
import { Inventory } from "./pages/Inventory";
import { Recipes } from "./pages/Recipes";
import { Settings } from "./pages/Settings";
import { Dashboard } from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Inventory />} />
        <Route path="/receitas" element={<Recipes />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
