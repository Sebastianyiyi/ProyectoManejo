import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { cooperativaService } from "@/lib/cooperativaService";
import type { Cooperativa } from "@/lib/cooperativaService";
import { getCooperativaActivaId, setCooperativaActivaId } from "@/lib/cooperativaActiva";

interface CooperativaContextType {
  cooperativas: Cooperativa[];
  cooperativaActiva: Cooperativa | null;
  loading: boolean;
  seleccionar: (id: number) => void;
  refrescar: () => Promise<void>;
}

const CooperativaContext = createContext<CooperativaContextType | null>(null);

export function CooperativaProvider({ children }: { children: ReactNode }) {
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [activaId, setActivaId] = useState<number | null>(() => getCooperativaActivaId());
  const [loading, setLoading] = useState(true);

  const refrescar = useCallback(async () => {
    const lista = await cooperativaService.getAll();
    setCooperativas(lista);
    // Si no hay una activa válida, se toma la primera de la lista.
    setActivaId((prev) => {
      if (prev && lista.some((c) => c.id === prev)) return prev;
      const primera = lista[0]?.id ?? null;
      if (primera) setCooperativaActivaId(primera);
      return primera;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const seleccionar = (id: number) => {
    setCooperativaActivaId(id);
    setActivaId(id);
  };

  const cooperativaActiva = cooperativas.find((c) => c.id === activaId) ?? null;

  return (
    <CooperativaContext.Provider
      value={{ cooperativas, cooperativaActiva, loading, seleccionar, refrescar }}
    >
      {children}
    </CooperativaContext.Provider>
  );
}

export function useCooperativa() {
  const ctx = useContext(CooperativaContext);
  if (!ctx) throw new Error("useCooperativa debe usarse dentro de CooperativaProvider");
  return ctx;
}
