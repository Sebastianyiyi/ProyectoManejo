import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Buscar from "./pages/Buscar";
import ChoferDashboard from "./pages/ChoferDashboard";
import { Layout } from "./components/ui/Layout";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import BusesPage from "./pages/dashboard/BusesPage";
import MisReservas from "./pages/MisReservas";
import Boleto from "./pages/Boleto";

const PaginaCompra = lazy(() => import("./pages/PaginaCompra"));
const NotFound = () => <div className="p-8 text-2xl font-bold">404 — Página no encontrada</div>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/buscar" element={<Buscar />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/chofer" element={<ChoferDashboard />} />
              <Route path="/mis-reservas" element={<MisReservas />} />
              <Route path="/boleto/:codigo" element={<Boleto />} />
              <Route path="/compra/:viajeId" element={
                <Suspense fallback={<div>Cargando...</div>}>
                  <PaginaCompra />
                </Suspense>
              } />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Bienvenido al panel</h1>
                </div>
              } />
              <Route path="buses" element={<BusesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
