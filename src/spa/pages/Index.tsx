import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user, loading, isAdmin, isConsultor, isCliente } = useAuth();

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

  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on role
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (isConsultor) {
    return <Navigate to="/consultor" replace />;
  }

  // Default to client portal
  return <Navigate to="/meu-projeto" replace />;
};

export default Index;
