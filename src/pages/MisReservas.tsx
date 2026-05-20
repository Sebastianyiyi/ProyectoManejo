import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Ticket, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTADO_LABEL: Record<string, { text: string; variant: "outline" | "secondary" | "default" | "destructive" }> = {
  pendiente_pago:       { text: "Pendiente de pago",  variant: "outline" },
  pendiente_validacion: { text: "Validando pago",      variant: "secondary" },
  confirmada:           { text: "Confirmada",          variant: "default" },
  rechazada:            { text: "Rechazada",           variant: "destructive" },
  cancelada:            { text: "Cancelada",           variant: "outline" },
  expirada:             { text: "Expirada",            variant: "outline" },
};

export default function MisReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("reservas")
        .select(`
          *,
          viajes (
            fecha_salida, fecha_llegada_est, precio_base,
            rutas (ciudad_origen, ciudad_destino),
            buses (placa, cooperativas (nombre))
          )
        `)
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });
      setReservas(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="py-16 grid place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Mis reservas</h1>

      {reservas.length === 0 ? (
        <Card className="p-12 text-center">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Aún no tienes reservas</h3>
          <p className="text-sm text-muted-foreground mb-4">Empieza buscando tu próximo viaje.</p>
          <Button asChild><Link to="/buscar">Buscar viajes</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => {
            const est = ESTADO_LABEL[r.estado] ?? { text: r.estado, variant: "outline" };
            const v = r.viajes;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={est.variant}>{est.text}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Código: <strong>{r.codigo}</strong>
                      </span>
                    </div>
                    <div className="font-semibold flex items-center gap-2">
                      {v?.rutas?.ciudad_origen}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {v?.rutas?.ciudad_destino}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {v?.fecha_salida
                          ? format(new Date(v.fecha_salida), "dd MMM yyyy", { locale: es })
                          : "—"}
                      </span>
                      <span>· {v?.fecha_salida
                        ? new Date(v.fecha_salida).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                      </span>
                      <span>· {v?.buses?.cooperativas?.nombre}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary mb-2">
                      ${Number(r.total).toFixed(2)}
                    </div>
                    {r.estado === "confirmada" ? (
                      <Button asChild size="sm">
                        <Link to={`/boleto/${r.codigo}`}>Ver boleto</Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/boleto/${r.codigo}`}>Ver detalle</Link>
                      </Button>
                    )}
                  </div>
                </div>
                {r.estado === "rechazada" && r.motivo_rechazo && (
                  <div className="mt-3 p-2 rounded bg-destructive/10 text-destructive text-xs">
                    Motivo: {r.motivo_rechazo}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}