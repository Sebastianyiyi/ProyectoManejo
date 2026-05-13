import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bus, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
  } | null;
  buses: {
    tipo: string;
    capacidad: number;
    placa: string;
    cooperativas: {
      id: string;
      nombre: string;
      logo_url: string | null;
    } | null;
  } | null;
}

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [origen, setOrigen] = useState(params.get("origen") || "");
  const [destino, setDestino] = useState(params.get("destino") || "");
  const [fecha, setFecha] = useState(params.get("fecha") || today);
  const [tipo, setTipo] = useState(params.get("tipo") || "todos");
  const [cooperativa, setCooperativa] = useState(params.get("coop") || "todas");

  const [cooperativas, setCooperativas] = useState<{ id: string; nombre: string }[]>([]);
  const [resultados, setResultados] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("cooperativas")
      .select("id, nombre")
      .eq("activo", true)
      .then(({ data }) => { if (data) setCooperativas(data); });
  }, []);

  const buscar = async () => {
    setLoading(true);
    const fechaInicio = `${fecha}T00:00:00-05:00`;
    const fechaFin = `${fecha}T23:59:59-05:00`;

    const { data } = await supabase
      .from("viajes")
      .select(`
        id, fecha_salida, fecha_llegada_est, precio_base, estado,
        rutas (ciudad_origen, ciudad_destino, distancia_km, duracion_minutos),
        buses (tipo, capacidad, placa, cooperativas (id, nombre, logo_url))
      `)
      .eq("estado", "programado")
      .gte("fecha_salida", fechaInicio)
      .lte("fecha_salida", fechaFin)
      .order("fecha_salida");

    let res = (data ?? []) as unknown as Viaje[];

    if (origen.trim())
      res = res.filter((v) =>
        v.rutas?.ciudad_origen?.toLowerCase().includes(origen.trim().toLowerCase())
      );
    if (destino.trim())
      res = res.filter((v) =>
        v.rutas?.ciudad_destino?.toLowerCase().includes(destino.trim().toLowerCase())
      );
    if (tipo !== "todos") res = res.filter((v) => v.buses?.tipo === tipo);
    if (cooperativa !== "todas")
      res = res.filter((v) => v.buses?.cooperativas?.id === cooperativa);

    setResultados(res);
    setLoading(false);
  };

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setParams({ origen, destino, fecha, tipo, coop: cooperativa });
    buscar();
  };

  return (
    <div className="container py-8">
      <Card className="p-4 md:p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label>Origen</Label>
            <Input
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              placeholder="Ciudad"
            />
          </div>
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label>Destino</Label>
            <Input
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ciudad"
            />
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
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cooperativa</Label>
            <Select value={cooperativa} onValueChange={setCooperativa}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {cooperativas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
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
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {v.buses?.cooperativas?.nombre}
                    </Badge>
                    {v.buses?.tipo === "vip" && (
                      <Badge className="bg-accent text-accent-foreground">VIP</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{v.buses?.placa}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <div>
                      <div className="font-semibold text-lg">
                        {new Date(v.fecha_salida).toLocaleTimeString("es-EC", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {v.rutas?.ciudad_origen}
                      </div>
                    </div>
                    <div className="flex-1 border-t border-dashed border-border relative">
                      <Bus className="h-4 w-4 absolute -top-2 left-1/2 -translate-x-1/2 text-muted-foreground bg-card" />
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {new Date(v.fecha_llegada_est).toLocaleTimeString("es-EC", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {v.rutas?.ciudad_destino}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 md:border-l md:pl-4">
                  <div className="text-2xl font-bold text-primary">
                    ${Number(v.precio_base).toFixed(2)}
                  </div>
                  <Button onClick={() => navigate(`/compra/${v.id}`)}>
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
