import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TenantBrandingProvider } from "@/components/branding/TenantBrandingProvider";

// Pages
import Index from "./spa/pages/Index";
import Auth from "./spa/pages/Auth";
import Denuncia from "./spa/pages/Denuncia";
import ConsultaProtocolo from "./spa/pages/ConsultaProtocolo";
import Onboarding from "./spa/pages/Onboarding";
import Dashboard from "./spa/pages/Dashboard";
import MeuProjeto from "./spa/pages/cliente/MeuProjeto";
import DocumentosNecessarios from "./spa/pages/cliente/DocumentosNecessarios";
import ClienteDiagnostico from "./spa/pages/cliente/Diagnostico";
import ClienteTreinamentos from "./spa/pages/cliente/Treinamentos";
import TreinamentoDetalhe from "./spa/pages/cliente/TreinamentoDetalhe";
import NotFound from "./spa/pages/NotFound";

// Consultor Pages
import ConsultorDashboard from "./spa/pages/consultor/ConsultorDashboard";
import ConsultorClientes from "./spa/pages/consultor/ConsultorClientes";
import ConsultorDocumentos from "./spa/pages/consultor/ConsultorDocumentos";
import ConsultorDenuncias from "./spa/pages/consultor/ConsultorDenuncias";
import ConsultorTarefas from "./spa/pages/consultor/ConsultorTarefas";
import ConsultorCodigoEtica from "./spa/pages/consultor/ConsultorCodigoEtica";
import ConsultorAtas from "./spa/pages/consultor/ConsultorAtas";
import ConsultorAgendamento from "./spa/pages/consultor/ConsultorAgendamento";
import ConsultorAdesaoEtica from "./spa/pages/consultor/ConsultorAdesaoEtica";
import ConsultorRelatorios from "./spa/pages/consultor/ConsultorRelatorios";

// Cliente Pages
import RepositorioDocumentos from "./spa/pages/cliente/RepositorioDocumentos";
import ClienteCodigoEtica from "./spa/pages/cliente/CodigoEtica";

// Admin Pages
import AdminDashboard from "./spa/pages/admin/AdminDashboard";
import AdminUsuarios from "./spa/pages/admin/AdminUsuarios";
import AdminOrganizacoes from "./spa/pages/admin/AdminOrganizacoes";
import AdminCatalogo from "./spa/pages/admin/AdminCatalogo";
import AdminConfiguracoes from "./spa/pages/admin/AdminConfiguracoes";
import AdminIntegracoes from "./spa/pages/admin/AdminIntegracoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantBrandingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/denuncia" element={<Denuncia />} />
            <Route path="/consulta-protocolo" element={<ConsultaProtocolo />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Legacy dashboard redirect */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Consultor routes */}
            <Route
              path="/consultor"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/clientes"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorClientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/documentos"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorDocumentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/denuncias"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorDenuncias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/tarefas"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorTarefas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/codigo-etica"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorCodigoEtica />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/atas"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorAtas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/agendamento"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorAgendamento />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/adesao-etica"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorAdesaoEtica />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultor/relatorios"
              element={
                <ProtectedRoute requiredRoles={["admin", "consultor"]}>
                  <ConsultorRelatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminUsuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organizacoes"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminOrganizacoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/catalogo"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminCatalogo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/configuracoes"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminConfiguracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/integracoes"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminIntegracoes />
                </ProtectedRoute>
              }
            />

            {/* Client routes */}
            <Route
              path="/meu-projeto"
              element={
                <ProtectedRoute>
                  <MeuProjeto />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meu-projeto/diagnostico"
              element={
                <ProtectedRoute>
                  <ClienteDiagnostico />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meu-projeto/documentos-necessarios"
              element={
                <ProtectedRoute>
                  <DocumentosNecessarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meu-projeto/treinamentos"
              element={
                <ProtectedRoute>
                  <ClienteTreinamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meu-projeto/treinamentos/:id"
              element={
                <ProtectedRoute>
                  <TreinamentoDetalhe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meu-projeto/codigo-etica"
              element={
                <ProtectedRoute>
                  <ClienteCodigoEtica />
                </ProtectedRoute>
              }
            />

            <Route
              path="/meu-projeto/documentos"
              element={
                <ProtectedRoute>
                  <RepositorioDocumentos />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TenantBrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
