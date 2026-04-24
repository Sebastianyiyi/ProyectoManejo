import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// 1. IMPORTAMOS TU NUEVA PÁGINA (Asegúrate de que la ruta sea correcta)
import Index from "./pages/Index"; 

// 2. Mantenemos las páginas de prueba para Auth y NotFound (las cambiaremos después)
const Auth = () => <div className="p-8 text-2xl font-bold">Login / Register</div>;
const NotFound = () => <div className="p-8 text-2xl font-bold">404 — Página no encontrada</div>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 3. Ahora este <Index /> hace referencia a tu archivo de la carpeta pages */}
          <Route path="/" element={<Index/>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;