import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LanguageContext";
import { useCooperativa } from "@/contexts/CooperativaContext";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bus, Map, CalendarClock, Ticket, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Stats {
  buses: number;
  rutas: number;
  viajesProgramados: number;
  reservasPendientes: number;
  boletosEmitidos: number;
}

interface ViajeProximo {
  id: number;
  fecha_salida: string;
  precio_base: number;
  rutas: { ciudad_origen: string; ciudad_destino: string } | null;
  frecuencias: { ciudad_origen: string; ciudad_destino: string } | null;
  buses: { placa: string } | null;
}

// Origen/destino del viaje: de su ruta o, si no tiene, de su frecuencia.
const rutaOrigen = (v: ViajeProximo) => v.rutas?.ciudad_origen ?? v.frecuencias?.ciudad_origen ?? "—";
const rutaDestino = (v: ViajeProximo) => v.rutas?.ciudad_destino ?? v.frecuencias?.ciudad_destino ?? "—";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

const estadoBadgeClass: Record<string, string> = {
  verificada: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pendiente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  suspendida: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function InicioPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const { cooperativa, loading: loadingCoop } = useCooperativa();
  const [stats, setStats] = useState<Stats | null>(null);
  const [proximos, setProximos] = useState<ViajeProximo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cooperativa) {
      if (!loadingCoop) setLoading(false);
      return;
    }
    async function load(coopId: number) {
      try {
        const [
          { count: buses },
          { count: rutas },
          { count: viajesProg },
          { count: reservasPend },
          { count: boletos },
          { data: proximosViajes },
        ] = await Promise.all([
          supabase.from("buses").select("*", { count: "exact", head: true }).eq("cooperativa_id", coopId).eq("activo", true),
          supabase.from("rutas").select("*", { count: "exact", head: true }),
          supabase.from("viajes").select("*", { count: "exact", head: true }).eq("estado", "programado"),
          supabase.from("reservas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_pago"),
          supabase.from("boletos").select("*", { count: "exact", head: true }).eq("estado", "activo"),
          supabase
            .from("viajes")
            .select("id, fecha_salida, precio_base, rutas(ciudad_origen, ciudad_destino), frecuencias(ciudad_origen, ciudad_destino), buses(placa)")
            .eq("estado", "programado")
            .gte("fecha_salida", new Date().toISOString())
            .order("fecha_salida", { ascending: true })
            .limit(6),
        ]);

        setStats({
          buses: buses ?? 0,
          rutas: rutas ?? 0,
          viajesProgramados: viajesProg ?? 0,
          reservasPendientes: reservasPend ?? 0,
          boletosEmitidos: boletos ?? 0,
        });
        setProximos((proximosViajes as unknown as ViajeProximo[]) ?? []);
      } catch {
        toast({ title: t("coop_error"), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load(cooperativa.id);
  }, [cooperativa, loadingCoop, toast, t]);

  if (loading || loadingCoop) {
    return <div className="p-6 text-muted-foreground text-sm">{t("coop_loading")}</div>;
  }

  if (!cooperativa) {
    return (
      <div className="p-6 text-muted-foreground text-sm">{t("coop_not_found")}</div>
    );
  }

  const coop = cooperativa;
  const estadoLabelKey = coop.estado === "verificada"
    ? "coop_estado_verificada"
    : coop.estado === "suspendida"
    ? "coop_estado_suspendida"
    : "coop_estado_pendiente";
  const badgeClass = estadoBadgeClass[coop.estado] ?? estadoBadgeClass.pendiente;

  return (
    <div className="p-6 space-y-6">
      {/* Header cooperativa activa */}
      <div className="flex items-start gap-4">
        {coop.logo_url ? (
          <img src={coop.logo_url} alt="logo" className="h-14 w-14 rounded-lg object-contain border" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-primary/10 grid place-items-center">
            <Bus size={24} className="text-primary" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{coop.nombre}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
              {t(estadoLabelKey)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            RUC: {coop.ruc}
            {coop.ciudad_principal && ` · ${coop.ciudad_principal}`}
          </p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Bus} label={t("coop_stat_buses")} value={stats.buses} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard icon={Map} label={t("coop_stat_rutas")} value={stats.rutas} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
          <StatCard icon={CalendarClock} label={t("coop_stat_viajes")} value={stats.viajesProgramados} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <StatCard icon={Clock} label={t("coop_stat_reservas")} value={stats.reservasPendientes} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
          <StatCard icon={Ticket} label={t("coop_stat_boletos")} value={stats.boletosEmitidos} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        </div>
      )}

      {/* Próximos viajes */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-primary" />
          {t("coop_upcoming")}
        </h2>
        {proximos.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg">
            <AlertCircle size={16} />
            {t("coop_no_upcoming")}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_route")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_date")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_bus")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("coop_col_price")}</th>
                </tr>
              </thead>
              <tbody>
                {proximos.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-4 py-3 font-medium">
                      {rutaOrigen(v)} → {rutaDestino(v)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(v.fecha_salida).toLocaleString("es-EC", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.buses?.placa ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">${Number(v.precio_base).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
