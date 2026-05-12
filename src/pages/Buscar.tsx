// src/pages/Buscar.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Clock, Bus, ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";



interface Viaje {
  id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  precio_base: number;
  estado: string;
  rutas: {
    ciudad_origen: string;
    ciudad_destino: string;
    distancia_km: number;
    duracion_minutos: number;
  };
  buses: {
    capacidad: number;
    tipo: string;
    placa: string;
    cooperativas: {
      nombre: string;
      logo_url?: string;
    };
  };
  asientos_disponibles?: number;
}

export default function Buscar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Campos del buscador (pre-llenados desde la URL)
  const [origen, setOrigen] = useState(searchParams.get("origen") ?? "");
  const [destino, setDestino] = useState(searchParams.get("destino") ?? "");
  const [fecha, setFecha] = useState(searchParams.get("fecha") ?? "");

  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // Buscar automáticamente si vienen parámetros en la URL
  //useEffect(() => {
    //if (origen && destino && fecha) {
    //  buscarViajes();
  // }
 //}, []);

  async function buscarViajes() {
    if (!origen || !destino || !fecha) {
      alert("Completa origen, destino y fecha");
      return;
    }

    setCargando(true);
    setBuscado(true);

    try {
      // Fecha inicio y fin del día seleccionado
        const fechaInicio = `${fecha}T00:00:00-05:00`;
        const fechaFin = `${fecha}T23:59:59-05:00`;

// Primero buscar la ruta que coincida
const { data: rutas } = await supabase
  .from("rutas")
  .select("id")
  .ilike("ciudad_origen", `%${origen}%`)
  .ilike("ciudad_destino", `%${destino}%`);
console.log("RUTAS ENCONTRADAS:", rutas);
if (!rutas || rutas.length === 0) {
  setViajes([]);
  setCargando(false);
  return;
}


const rutaIds = rutas.map((r) => r.id);

// Luego buscar viajes con esas rutas
const { data, error } = await supabase

  .from("viajes")
  
  .select(`
    id, fecha_salida, fecha_llegada_est, precio_base, estado,
    rutas (ciudad_origen, ciudad_destino, distancia_km, duracion_minutos),
    buses (capacidad, tipo, placa, cooperativas (nombre, logo_url))
  `)
  .in("ruta_id", rutaIds)
  .gte("fecha_salida", fechaInicio)
  .lte("fecha_salida", fechaFin)
  .eq("estado", "programado")
  .order("fecha_salida");
console.log("RUTAS IDs:", rutaIds);
console.log("FECHAS:", fechaInicio, fechaFin);
console.log("VIAJES:", data, "ERROR:", error);
      // Calcular asientos disponibles para cada viaje
      const viajesConDisponibilidad = await Promise.all(
        (data ?? []).map(async (viaje: any) => {
          const { count } = await supabase
            .from("detalle_reserva")
            .select("id", { count: "exact", head: true })
            .eq("reservas.viaje_id", viaje.id)
            .in("reservas.estado", ["pendiente_pago", "confirmada"])

          const disponibles = (viaje.buses?.capacidad ?? 0) - (count ?? 0);
          return { ...viaje, asientos_disponibles: Math.max(0, disponibles) };
        })
      );

      setViajes(viajesConDisponibilidad);
    } catch (e: any) {
      console.error(e);
      alert("Error buscando viajes: " + e.message);
    } finally {
      setCargando(false);
    }
  }

  function formatHora(fechaStr: string) {
    return new Date(fechaStr).toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuracion(minutos: number) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Buscador (mini versión) */}
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Origen</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="¿De dónde sales?"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Destino</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="¿A dónde vas?"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fecha</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={buscarViajes}
              className="w-full h-9 text-sm"
              disabled={cargando}
            >
              {cargando ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Resultados */}
      {cargando && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Buscando viajes disponibles...</p>
        </div>
      )}

      {!cargando && buscado && viajes.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Bus className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No encontramos viajes</h3>
          <p className="text-muted-foreground text-sm">
            No hay viajes de <strong>{origen}</strong> a <strong>{destino}</strong> para el{" "}
            {fecha ? new Date(fecha + "T12:00:00").toLocaleDateString("es-EC", { dateStyle: "long" }) : ""}
          </p>
        </div>
      )}

      {!cargando && viajes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {viajes.length} viaje{viajes.length > 1 ? "s" : ""} disponible{viajes.length > 1 ? "s" : ""} —{" "}
            <span className="font-medium text-foreground">
              {origen} → {destino}
            </span>
          </p>

          {viajes.map((viaje) => (
            <Card
              key={viaje.id}
              className="p-5 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/compra/${viaje.id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Info principal */}
                <div className="flex-1 space-y-3">
                  {/* Cooperativa */}
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bus className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {viaje.buses?.cooperativas?.nombre ?? "Cooperativa"}
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {viaje.buses?.tipo ?? "Estándar"}
                    </span>
                  </div>

                  {/* Horario */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatHora(viaje.fecha_salida)}</p>
                      <p className="text-xs text-muted-foreground">{viaje.rutas?.ciudad_origen}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {viaje.rutas?.duracion_minutos
                          ? formatDuracion(viaje.rutas.duracion_minutos)
                          : "—"}
                      </div>
                      <div className="w-full flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <div className="flex-1 h-px bg-border" />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      {viaje.rutas?.distancia_km && (
                        <p className="text-xs text-muted-foreground">
                          {viaje.rutas.distancia_km} km
                        </p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatHora(viaje.fecha_llegada_est)}</p>
                      <p className="text-xs text-muted-foreground">{viaje.rutas?.ciudad_destino}</p>
                    </div>
                  </div>

                  {/* Disponibilidad */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span
                      className={
                        (viaje.asientos_disponibles ?? 0) <= 5
                          ? "text-orange-500 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {viaje.asientos_disponibles} asiento{viaje.asientos_disponibles !== 1 ? "s" : ""} disponible{viaje.asientos_disponibles !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Precio y botón */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:min-w-[140px]">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">desde</p>
                    <p className="text-2xl font-bold text-primary">
                      ${viaje.precio_base.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    className="group-hover:bg-primary/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/compra/${viaje.id}`);
                    }}
                  >
                    Seleccionar
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

