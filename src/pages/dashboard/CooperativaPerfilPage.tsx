import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cooperativaService } from "@/lib/cooperativaService";
import type { Cooperativa } from "@/lib/cooperativaService";
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
  buses: { placa: string } | null;
}

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

const estadoBadge: Record<string, { label: string; class: string }> = {
  verificada: { label: "Verificada", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pendiente: { label: "Pendiente", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  suspendida: { label: "Suspendida", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function CooperativaPerfilPage() {
  const { toast } = useToast();
  const [cooperativa, setCooperativa] = useState<Cooperativa | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [proximos, setProximos] = useState<ViajeProximo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const coop = await cooperativaService.get();
        setCooperativa(coop);

        const [
          { count: buses },
          { count: rutas },
          { count: viajesProg },
          { count: reservasPend },
          { count: boletos },
          { data: proximosViajes },
        ] = await Promise.all([
          supabase.from("buses").select("*", { count: "exact", head: true }).eq("cooperativa_id", coop.id).eq("activo", true),
          supabase.from("rutas").select("*", { count: "exact", head: true }),
          supabase.from("viajes").select("*", { count: "exact", head: true }).eq("estado", "programado"),
          supabase.from("reservas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_pago"),
          supabase.from("boletos").select("*", { count: "exact", head: true }).eq("estado", "activo"),
          supabase
            .from("viajes")
            .select("id, fecha_salida, precio_base, rutas(ciudad_origen, ciudad_destino), buses(placa)")
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
        toast({ title: "Error al cargar estadísticas", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Cargando panel...</div>;

  if (!cooperativa) return (
    <div className="p-6 text-muted-foreground text-sm">
      No se encontró ninguna cooperativa en la base de datos.
    </div>
  );

  const badge = estadoBadge[cooperativa.estado] ?? estadoBadge.pendiente;

  return (
    <div className="p-6 space-y-6">
      {/* Header cooperativa */}
      <div className="flex items-start gap-4">
        {cooperativa.logo_url ? (
          <img src={cooperativa.logo_url} alt="logo" className="h-14 w-14 rounded-lg object-contain border" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-primary/10 grid place-items-center">
            <Bus size={24} className="text-primary" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{cooperativa.nombre}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.class}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            RUC: {cooperativa.ruc}
            {cooperativa.ciudad_principal && ` · ${cooperativa.ciudad_principal}`}
          </p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Bus} label="Buses activos" value={stats.buses} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard icon={Map} label="Rutas totales" value={stats.rutas} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
          <StatCard icon={CalendarClock} label="Viajes programados" value={stats.viajesProgramados} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <StatCard icon={Clock} label="Reservas pendientes" value={stats.reservasPendientes} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
          <StatCard icon={Ticket} label="Boletos emitidos" value={stats.boletosEmitidos} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        </div>
      )}

      {/* Próximos viajes */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-primary" />
          Próximos viajes programados
        </h2>
        {proximos.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg">
            <AlertCircle size={16} />
            No hay viajes programados próximamente.
          </div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Ruta</th>
                  <th className="text-left px-4 py-3 font-medium">Fecha de salida</th>
                  <th className="text-left px-4 py-3 font-medium">Bus</th>
                  <th className="text-right px-4 py-3 font-medium">Precio base</th>
                </tr>
              </thead>
              <tbody>
                {proximos.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-4 py-3 font-medium">
                      {v.rutas?.ciudad_origen} → {v.rutas?.ciudad_destino}
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
