import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Bus, MapPin, TicketCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RutaInfo {
  ciudad_origen: string;
  ciudad_destino: string;
}

interface BusInfo {
  placa: string;
  numero: string | null;
  tipo: string;
}

interface ViajeChofer {
  id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  precio_base: number;
  estado: string;
  rutas: RutaInfo | null;
  buses: BusInfo | null;
}

interface ViajeChoferSupabase {
  id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  precio_base: number;
  estado: string;
  rutas: RutaInfo[] | RutaInfo | null;
  buses: BusInfo[] | BusInfo | null;
}

export default function ChoferDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [viajes, setViajes] = useState<ViajeChofer[]>([]);
  const [cargandoViajes, setCargandoViajes] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (user.role !== "chofer") {
      navigate("/", { replace: true });
      return;
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const cargarViajes = async () => {
      if (!user?.id || user.role !== "chofer") return;

      setCargandoViajes(true);

      const { data, error } = await supabase
        .from("viajes")
        .select(`
          id,
          fecha_salida,
          fecha_llegada_est,
          precio_base,
          estado,
          rutas (
            ciudad_origen,
            ciudad_destino
          ),
          buses (
            placa,
            numero,
            tipo
          )
        `)
        .eq("chofer_id", user.id)
        .order("fecha_salida", { ascending: true });

      if (error) {
        console.error("Error al cargar viajes del chofer:", error);
        setViajes([]);
        setCargandoViajes(false);
        return;
      }

      const viajesNormalizados: ViajeChofer[] = ((data ?? []) as ViajeChoferSupabase[]).map(
        (viaje) => ({
          id: viaje.id,
          fecha_salida: viaje.fecha_salida,
          fecha_llegada_est: viaje.fecha_llegada_est,
          precio_base: Number(viaje.precio_base),
          estado: viaje.estado,
          rutas: Array.isArray(viaje.rutas) ? viaje.rutas[0] ?? null : viaje.rutas,
          buses: Array.isArray(viaje.buses) ? viaje.buses[0] ?? null : viaje.buses,
        })
      );

      setViajes(viajesNormalizados);
      setCargandoViajes(false);
    };

    cargarViajes();
  }, [user]);

  if (loading) {
    return (
      <div className="container py-10 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cargando sesión...</span>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Panel del Chofer</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.name}. Desde aquí podrás revisar tus viajes asignados y luego
          validar boletos.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Bus className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Viajes asignados</p>
              <p className="text-2xl font-bold">{viajes.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Próximo viaje</p>
              <p className="text-lg font-semibold">
                {viajes[0]
                  ? new Date(viajes[0].fecha_salida).toLocaleDateString()
                  : "Sin viajes"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <TicketCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Validación de boletos</p>
              <p className="text-lg font-semibold">Pendiente</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Mis viajes asignados</h2>

        {cargandoViajes ? (
          <Card className="p-6 flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando viajes...</span>
          </Card>
        ) : viajes.length === 0 ? (
          <Card className="p-6 text-muted-foreground">
            No tienes viajes asignados por el momento.
          </Card>
        ) : (
          <div className="grid gap-4">
            {viajes.map((viaje) => (
              <Card key={viaje.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />

                      <h3 className="font-semibold">
                        {viaje.rutas?.ciudad_origen ?? "Origen no disponible"} →{" "}
                        {viaje.rutas?.ciudad_destino ?? "Destino no disponible"}
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Salida: {new Date(viaje.fecha_salida).toLocaleString()}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Llegada estimada:{" "}
                      {new Date(viaje.fecha_llegada_est).toLocaleString()}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Bus: {viaje.buses?.placa ?? "No asignado"}{" "}
                      {viaje.buses?.numero ? `- Nº ${viaje.buses.numero}` : ""}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Tipo de bus: {viaje.buses?.tipo ?? "No definido"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {viaje.estado}
                    </span>

                    <Button variant="outline" disabled>
                      Ver pasajeros
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}