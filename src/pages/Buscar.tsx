import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bus, Clock, MapPin } from "lucide-react";

interface Frecuencia {
  id: string;
  origen: string;
  destino: string;
  hora_salida: string;
  duracion_minutos: number;
  precio: number;
  cooperativa_id: string;
  bus_id: string | null;
  cooperativas: { nombre: string; logo_url: string | null } | null;
  buses: { tipo: string; capacidad: number; marca_chasis: string | null; numero_interno: string } | null;
}

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [origen, setOrigen] = useState(params.get("origen") || "");
  const [destino, setDestino] = useState(params.get("destino") || "");
  const [fecha, setFecha] = useState(params.get("fecha") || today);
  const [tipo, setTipo] = useState<string>(params.get("tipo") || "todos");
  const [cooperativa, setCooperativa] = useState<string>(params.get("coop") || "todas");

  const [cooperativas, setCooperativas] = useState<{ id: string; nombre: string }[]>([]);
  const [resultados, setResultados] = useState<Frecuencia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("cooperativas").select("id, nombre").eq("activo", true).then(({ data }) => {
      if (data) setCooperativas(data);
    });
  }, []);

  const buscar = async () => {
    setLoading(true);
    let q = supabase
      .from("frecuencias")
      .select("*, cooperativas(nombre, logo_url), buses(tipo, capacidad, marca_chasis, numero_interno)")
      .eq("activo", true);
    if (origen.trim()) q = q.ilike("origen", `%${origen.trim()}%`);
    if (destino.trim()) q = q.ilike("destino", `%${destino.trim()}%`);
    if (cooperativa !== "todas") q = q.eq("cooperativa_id", cooperativa);
    const { data } = await q.order("hora_salida");
    let res = (data ?? []) as Frecuencia[];
    if (tipo !== "todos") res = res.filter((f) => f.buses?.tipo === tipo);
    // filtrar por día de la semana operación
    const dow = new Date(fecha + "T12:00:00").getDay();
    // tabla guarda dias_operacion pero no lo seleccionamos arriba — refetch para comprobarlo
    const { data: full } = await supabase.from("frecuencias").select("id, dias_operacion").in("id", res.map((r) => r.id));
    const okIds = new Set((full ?? []).filter((f) => (f.dias_operacion as number[]).includes(dow)).map((f) => f.id));
    res = res.filter((f) => okIds.has(f.id));
    setResultados(res);
    setLoading(false);
  };

  useEffect(() => { buscar(); /* eslint-disable-next-line */ }, []);

  const handleSubmit = (e: React.FormEvent) => {
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
            <Input value={origen} onChange={(e) => setOrigen(e.target.value)} placeholder="Ciudad" />
          </div>
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label>Destino</Label>
            <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Ciudad" />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" min={today} value={fecha} onChange={(e) => setFecha(e.target.value)} />
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
                {cooperativas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Buscar</Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="py-16 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : resultados.length === 0 ? (
        <Card className="p-12 text-center">
          <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No encontramos viajes</h3>
          <p className="text-sm text-muted-foreground">Prueba ajustando los filtros o cambia la fecha.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {resultados.map((f) => (
            <Card key={f.id} className="p-4 md:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{f.cooperativas?.nombre}</Badge>
                    {f.buses?.tipo === "vip" && <Badge className="bg-accent text-accent-foreground">VIP</Badge>}
                    {f.buses?.marca_chasis && <span className="text-xs text-muted-foreground">{f.buses.marca_chasis}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-foreground">
                    <div>
                      <div className="font-semibold text-lg">{f.hora_salida.slice(0, 5)}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{f.origen}</div>
                    </div>
                    <div className="flex-1 border-t border-dashed border-border relative">
                      <Bus className="h-4 w-4 absolute -top-2 left-1/2 -translate-x-1/2 text-muted-foreground bg-card px-0.5" />
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">→ {f.destino}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Clock className="h-3 w-3" />{f.duracion_minutos} min</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 md:border-l md:pl-4">
                  <div className="text-2xl font-bold text-primary">${Number(f.precio).toFixed(2)}</div>
                  <Button onClick={() => navigate(`/viajes/${f.id}/${fecha}/asientos`)}>Elegir asientos</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
