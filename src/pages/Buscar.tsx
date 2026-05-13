import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bus, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bus, Clock, MapPin } from "lucide-react";

// ✅ CAMBIO: interface adaptada a las tablas reales (viajes + rutas)
interface Viaje {
  id: number;
  fecha_salida: string;
  fecha_llegada_est: string;
  precio_base: number;
  ruta_id: number;
  bus_id: number;
  rutas: {
    ciudad_origen: string;
    ciudad_destino: string;
    distancia_km: number;
    duracion_minutos: number;
  } | null;
  buses: {
    tipo: string;
    capacidad: number;
  } | null;
}

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [origen, setOrigen] = useState(params.get("origen") || "");
  const [destino, setDestino] = useState(params.get("destino") || "");
  const [fecha, setFecha] = useState(params.get("fecha") || today);
  const [tipo, setTipo] = useState<string>(params.get("tipo") || "todos");

  const [ciudades, setCiudades] = useState<string[]>([]);
  const [sugerenciasOrigen, setSugerenciasOrigen] = useState<string[]>([]);
  const [sugerenciasDestino, setSugerenciasDestino] = useState<string[]>([]);

  const [resultados, setResultados] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ CAMBIO: ciudades desde tabla rutas (ciudad_origen y ciudad_destino)
  useEffect(() => {
    const cargarCiudades = async () => {
      const { data } = await supabase
        .from("rutas")
        .select("ciudad_origen, ciudad_destino");
      if (data) {
        const todas = data.flatMap((r) => [r.ciudad_origen, r.ciudad_destino]);
        const unicas = [...new Set(todas)].sort();
        setCiudades(unicas);
      }
    };
    cargarCiudades();
  }, []);

  const buscar = async () => {
    setLoading(true);

    // ✅ CAMBIO: primero buscamos las rutas que coincidan con origen/destino
    let qRutas = supabase
      .from("rutas")
      .select("id");
    if (origen.trim()) qRutas = qRutas.ilike("ciudad_origen", `%${origen.trim()}%`);
    if (destino.trim()) qRutas = qRutas.ilike("ciudad_destino", `%${destino.trim()}%`);

    const { data: rutasData } = await qRutas;
    const rutaIds = (rutasData ?? []).map((r) => r.id);

    if (rutaIds.length === 0) {
      setResultados([]);
      setLoading(false);
      return;
    }

    // ✅ CAMBIO: luego buscamos viajes que usen esas rutas y coincidan con la fecha
    let q = supabase
      .from("viajes")
      .select("*, rutas(ciudad_origen, ciudad_destino, distancia_km, duracion_minutos), buses(tipo, capacidad)")
      .in("ruta_id", rutaIds)
      .gte("fecha_salida", `${fecha}T00:00:00`)
      .lte("fecha_salida", `${fecha}T23:59:59`)
      .order("fecha_salida");

    const { data } = await q;
    let res = (data ?? []) as Viaje[];

    if (tipo !== "todos") res = res.filter((v) => v.buses?.tipo === tipo);

    setResultados(res);
    setLoading(false);
  };

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setParams({ origen, destino, fecha, tipo });
    buscar();
  };

  // Helper para calcular duración entre dos timestamps
  const calcularDuracion = (salida: string, llegada: string) => {
    const diff = new Date(llegada).getTime() - new Date(salida).getTime();
    return Math.round(diff / 60000);
  };

  return (
    <div className="container py-8">
      <Card className="p-4 md:p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3">

          {/* Input Origen con autocomplete */}
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label>Origen</Label>
            <div className="relative">
              <Input
                value={origen}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrigen(val);
                  setSugerenciasOrigen(
                    val.length > 0
                      ? ciudades.filter((c) => c.toLowerCase().startsWith(val.toLowerCase()))
                      : []
                  );
                }}
                onBlur={() => setTimeout(() => setSugerenciasOrigen([]), 150)}
                placeholder="Ciudad"
                autoComplete="off"
              />
              {sugerenciasOrigen.length > 0 && (
                <ul className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
                  {sugerenciasOrigen.map((c) => (
                    <li
                      key={c}
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onMouseDown={() => { setOrigen(c); setSugerenciasOrigen([]); }}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Input Destino con autocomplete */}
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label>Destino</Label>
            <div className="relative">
              <Input
                value={destino}
                onChange={(e) => {
                  const val = e.target.value;
                  setDestino(val);
                  setSugerenciasDestino(
                    val.length > 0
                      ? ciudades.filter((c) => c.toLowerCase().startsWith(val.toLowerCase()))
                      : []
                  );
                }}
                onBlur={() => setTimeout(() => setSugerenciasDestino([]), 150)}
                placeholder="Ciudad"
                autoComplete="off"
              />
              {sugerenciasDestino.length > 0 && (
                <ul className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md mt-1 max-h-48 overflow-y-auto">
                  {sugerenciasDestino.map((c) => (
                    <li
                      key={c}
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onMouseDown={() => { setDestino(c); setSugerenciasDestino([]); }}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input
              type="date"
              min={today}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="focus:bg-primary focus:text-primary-foreground">Todos</SelectItem>
                <SelectItem value="normal" className="focus:bg-primary focus:text-primary-foreground">Normal</SelectItem>
                <SelectItem value="vip" className="focus:bg-primary focus:text-primary-foreground">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full">Buscar</Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="py-16 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div className="py-16 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : resultados.length === 0 ? (
        <Card className="p-12 text-center">
          <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No encontramos viajes</h3>
          <p className="text-sm text-muted-foreground">
            Prueba ajustando los filtros o cambia la fecha.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {resultados.map((v) => (
            <Card key={v.id} className="p-4 md:p-5 hover:shadow-md transition-shadow">
          {resultados.map((v) => (
            <Card key={v.id} className="p-4 md:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {v.buses?.tipo === "vip" && (
                      <Badge className="bg-accent text-accent-foreground">VIP</Badge>
                    )}
                    {v.buses?.tipo === "normal" && (
                      <Badge variant="secondary">Normal</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <div>
                      <div className="font-semibold text-lg">
                        {new Date(v.fecha_salida).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{v.rutas?.ciudad_origen}
                      </div>
                    </div>
                    <div className="flex-1 border-t border-dashed border-border relative">
                      <Bus className="h-4 w-4 absolute -top-2 left-1/2 -translate-x-1/2 text-muted-foreground bg-card" />
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">→ {v.rutas?.ciudad_destino}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {calcularDuracion(v.fecha_salida, v.fecha_llegada_est)} min
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 md:border-l md:pl-4">
                  <div className="text-2xl font-bold text-primary">${Number(v.precio_base).toFixed(2)}</div>
                  <Button onClick={() => navigate(`/viajes/${v.id}/asientos`)}>
                    Elegir asientos
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