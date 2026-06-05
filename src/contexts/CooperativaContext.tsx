import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { cooperativaService } from "@/lib/cooperativaService";
import type { Cooperativa, CooperativaUpdate } from "@/lib/cooperativaService";
import { setCooperativaActivaId } from "@/lib/cooperativaActiva";

interface CooperativaContextType {
  cooperativa: Cooperativa | null;
  loading: boolean;
  actualizar: (fields: CooperativaUpdate) => Promise<void>;
  refrescar: () => Promise<void>;
}

const CooperativaContext = createContext<CooperativaContextType | null>(null);

export function CooperativaProvider({ children }: { children: ReactNode }) {
  const [cooperativa, setCooperativa] = useState<Cooperativa | null>(null);
  const [loading, setLoading] = useState(true);

  const refrescar = useCallback(async () => {
    try {
      const coop = await cooperativaService.get();
      setCooperativa(coop);
      // Guarda el id para que busService filtre los buses por esta cooperativa.
      setCooperativaActivaId(coop.id);
    } catch {
      setCooperativa(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const actualizar = async (fields: CooperativaUpdate) => {
    if (!cooperativa) return;
    const actualizada = await cooperativaService.update(cooperativa.id, fields);
    setCooperativa(actualizada);
  };

  return (
    <CooperativaContext.Provider value={{ cooperativa, loading, actualizar, refrescar }}>
      {children}
    </CooperativaContext.Provider>
  );
}

export function useCooperativa() {
  const ctx = useContext(CooperativaContext);
  if (!ctx) throw new Error("useCooperativa debe usarse dentro de CooperativaProvider");
  return ctx;
}
