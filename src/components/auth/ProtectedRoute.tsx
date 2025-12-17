import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ("admin" | "consultor" | "cliente" | "parceiro")[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading, roles, isAdmin, isConsultor, isCliente } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }

  // Check for required roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      // Redirect based on user's actual role
      if (isAdmin) {
        return <Navigate to="/admin" replace />;
      }
      if (isConsultor) {
        return <Navigate to="/consultor" replace />;
      }
      if (isCliente) {
        return <Navigate to="/meu-projeto" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
