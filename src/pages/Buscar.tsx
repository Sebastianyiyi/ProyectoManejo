import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  calcularPrecio,
  detectarDescuento,
  type TipoDescuento,
} from "@/lib/boletosService";
import { Loader2, Bus, Clock, MapPin, Star, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLang } from "@/contexts/LanguageContext";

// Interfaz de VladAlz con cooperativas anidadas en buses
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

// Etiqueta y estilo visual por tipo de bus (valores del constraint de BD)
const tipoBusConfig: Record<string, { label: string; className: string }> = {
  economico:  { label: "Normal",      className: "bg-slate-100 text-slate-700 border border-slate-300" },
  ejecutivo:  { label: "VIP",         className: "bg-amber-100 text-amber-700 border border-amber-400" },
  premium:    { label: "Doble Piso",  className: "bg-indigo-100 text-indigo-700 border border-indigo-400" },
};

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const today = new Date().toISOString().split("T")[0];

  const [origen, setOrigen] = useState(params.get("origen") || "");
  const [destino, setDestino] = useState(params.get("destino") || "");
  const [fecha, setFecha] = useState(params.get("fecha") || today);
  const [tipo, setTipo] = useState(params.get("tipo") || "todos");

  // Autocompletado (tu implementación)
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [sugerenciasOrigen, setSugerenciasOrigen] = useState<string[]>([]);
  const [sugerenciasDestino, setSugerenciasDestino] = useState<string[]>([]);

  const [resultados, setResultados] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);

  // Descuento del usuario autenticado
  const [tipoDescuento, setTipoDescuento] = useState<TipoDescuento>("ninguno");

  // Cargar ciudades y perfil del usuario al montar
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

    const cargarDescuentoUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("fecha_nacimiento, tiene_discapacidad")
        .eq("email", user.email)
        .single();
      if (perfil) setTipoDescuento(detectarDescuento(perfil));
    };

    cargarCiudades();
    cargarDescuentoUsuario();
  }, []);

  // Consulta de VladAlz con timezone y estado programado
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

    setResultados(res);
    setLoading(false);
  };

  useEffect(() => { buscar(); /* eslint-disable-next-line */ }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ origen, destino, fecha, tipo });
    buscar();
  };

  return (
    <div className="container py-8">
      <Card className="p-4 md:p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3">

          {/* Origen con autocompletado */}
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label>{t("search_origin")}</Label>
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
                placeholder={t("buscar_city")}
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

          {/* Destino con autocompletado */}
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label>{t("search_destination")}</Label>
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
                placeholder={t("buscar_city")}
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
            <Label>{t("search_date")}</Label>
            <Input type="date" min={today} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("buscar_bus_type")}</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="focus:bg-primary focus:text-primary-foreground">{t("buscar_all")}</SelectItem>
                <SelectItem value="normal" className="focus:bg-primary focus:text-primary-foreground">Normal</SelectItem>
                <SelectItem value="vip" className="focus:bg-primary focus:text-primary-foreground">VIP</SelectItem>
                <SelectItem value="doble_piso" className="focus:bg-primary focus:text-primary-foreground">Doble Piso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full">{t("buscar_btn")}</Button>
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
          <h3 className="font-semibold mb-1">{t("buscar_empty_title")}</h3>
          <p className="text-sm text-muted-foreground">{t("buscar_empty_desc")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {resultados.map((v) => (
            <Card key={v.id} className="p-4 md:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="secondary">{v.buses?.cooperativas?.nombre}</Badge>
                    {v.buses?.tipo && tipoBusConfig[v.buses.tipo] && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoBusConfig[v.buses.tipo].className}`}>
                        {tipoBusConfig[v.buses.tipo].label}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{v.buses?.placa}</span>
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
                      {v.buses?.tipo === "premium"
                        ? <ArrowUpDown className="h-4 w-4 absolute -top-2 left-1/2 -translate-x-1/2 text-indigo-500 bg-card" />
                        : v.buses?.tipo === "ejecutivo"
                        ? <Star className="h-4 w-4 absolute -top-2 left-1/2 -translate-x-1/2 text-amber-500 bg-card" />
                        : <Bus className="h-4 w-4 absolute -top-2 left-1/2 -translate-x-1/2 text-muted-foreground bg-card" />
                      }
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {new Date(v.fecha_llegada_est).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />{v.rutas?.ciudad_destino}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 md:border-l md:pl-4">
                  {tipoDescuento !== "ninguno" ? (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground line-through">
                        ${Number(v.precio_base).toFixed(2)}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        ${calcularPrecio(Number(v.precio_base), tipoDescuento).toFixed(2)}
                      </p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {t("buscar_discount_applied")}
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-primary">
                      ${Number(v.precio_base).toFixed(2)}
                    </div>
                  )}
                  <Button onClick={() => navigate(`/compra/${v.id}`)}>
                    {t("buscar_select_seats")}
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