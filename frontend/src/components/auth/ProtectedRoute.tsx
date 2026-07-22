import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../../lib/auth-client";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
