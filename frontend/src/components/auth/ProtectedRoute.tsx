import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../../lib/auth-client";
import { useI18n } from "../../lib/i18n";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const { t } = useI18n();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted">
        {t.common.loading}
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
