import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { Layout } from "./components/ui/Layout";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import BusesPage from "./pages/dashboard/BusesPage";

const NotFound = () => <div className="p-8 text-2xl font-bold">404 — Página no encontrada</div>;

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
              <Route path="/auth" element={<Auth />} />
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
