import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";

const PaginaCompra = lazy(() => import("./pages/PaginaCompra"));

import Buscar from "./pages/Buscar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChoferDashboard from "./pages/ChoferDashboard";
import { Layout } from "./components/ui/Layout";

const NotFound = () => (
  <div className="p-8 text-2xl font-bold">
    404 — Página no encontrada
  </div>
);

const queryClient = new QueryClient();

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

              <Route
                path="/compra/:viajeId"
                element={
                  <Suspense fallback={<div>Cargando...</div>}>
                    <PaginaCompra />
                  </Suspense>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;