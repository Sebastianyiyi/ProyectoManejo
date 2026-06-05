import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ArrowRight, Bus } from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Boleto() {
  const { codigo } = useParams();
  const { user } = useAuth();
  const [reserva, setReserva] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select(`
          *,
          viajes (
            fecha_salida, fecha_llegada_est, precio_base,
            rutas (ciudad_origen, ciudad_destino, duracion_minutos),
            buses (placa, numero, tipo, cooperativas (nombre))
          ),
          detalle_reserva (
            id,
            asiento_id,
            precio_unitario,
            boletos (id, estado, usado_at)
          )
        `)
        .eq("id", codigo!)
        .maybeSingle();

      if (error) {
        console.error("Error al cargar boleto:", error);
      }

      setReserva(data);

      if (data) {
        // Generar el código QR con la URL absoluta para escaneado externo
        const ticketUrl = `${window.location.origin}/boleto/${data.id}`;
        const url = await QRCode.toDataURL(ticketUrl, { width: 320, margin: 1 });
        setQrDataUrl(url);
      }
      setLoading(false);
    })();
  }, [codigo]);

  // Efecto para validación automática si el usuario es chofer
  useEffect(() => {
    if (loading || !reserva || !user || user.role !== "chofer" || reserva.estado !== "confirmada") return;

    const autoValidate = async () => {
      const detalles = reserva.detalle_reserva ?? [];
      const boletosActivos = detalles
        .flatMap((d: any) => d.boletos ? [d.boletos] : [])
        .filter((b: any) => b.estado === "activo");

      if (boletosActivos.length > 0) {
        const ids = boletosActivos.map((b: any) => b.id);
        const fechaUso = new Date().toISOString();
        const { error } = await supabase
          .from("boletos")
          .update({ estado: "usado", usado_at: fechaUso })
          .in("id", ids);

        if (!error) {
          toast.success("Boleto(s) validado(s) automáticamente.");
          setReserva((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              detalle_reserva: prev.detalle_reserva.map((dr: any) => {
                if (dr.boletos && ids.includes(dr.boletos.id)) {
                  return {
                    ...dr,
                    boletos: { ...dr.boletos, estado: "usado", usado_at: fechaUso }
                  };
                }
                return dr;
              })
            };
          });
        } else {
          console.error("Error al auto-validar asistencia:", error);
          toast.error("No se pudo auto-validar el boleto.");
        }
      }
    };

    autoValidate();
  }, [reserva, user, loading]);

  const descargarPDF = () => {
    if (!reserva || !qrDataUrl) return;
    const v = reserva.viajes;
    const fechaSalida = new Date(v?.fecha_salida);
    const doc = new jsPDF({ unit: "mm", format: "a5" });

    doc.setFillColor(15, 50, 120);
    doc.rect(0, 0, 148, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("BusEcuador — Boleto digital", 10, 16);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    let y = 35;
    doc.text(`Reserva #${reserva.id}`, 10, y); y += 7;
    doc.text(`Cooperativa: ${v?.buses?.cooperativas?.nombre ?? ""}`, 10, y); y += 6;
    doc.text(`${v?.rutas?.ciudad_origen} → ${v?.rutas?.ciudad_destino}`, 10, y); y += 6;
    doc.text(`Fecha: ${format(fechaSalida, "dd/MM/yyyy", { locale: es })}`, 10, y); y += 6;
    doc.text(`Hora: ${fechaSalida.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}`, 10, y); y += 6;
    doc.text(`Bus Nº: ${v?.buses?.numero ?? "—"}`, 10, y); y += 6;
    doc.text(`Placa: ${v?.buses?.placa ?? ""}`, 10, y); y += 8;
    doc.text(`Total pagado: $${Number(reserva.precio_total).toFixed(2)}`, 10, y);

    doc.addImage(qrDataUrl, "PNG", 95, 35, 45, 45);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Presenta este código al abordar", 95, 84);
    doc.save(`boleto-${reserva.id}.pdf`);
  };

  if (loading) return (
    <div className="py-16 grid place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!reserva) return (
    <div className="container py-12">
      <Card className="p-8 text-center">Boleto no encontrado.</Card>
    </div>
  );

  const v = reserva.viajes;
  const confirmada = reserva.estado === "confirmada";
  const fechaSalida = v?.fecha_salida ? new Date(v.fecha_salida) : null;

  // Calcular si todos los boletos fueron validados (usados)
  const boletosList = (reserva.detalle_reserva ?? [])
    .map((d: any) => d.boletos)
    .filter(Boolean);
  const todosUsados = boletosList.length > 0 && boletosList.every((b: any) => b.estado === "usado");

  return (
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/mis-reservas">← Volver a mis reservas</Link>
      </Button>

      {!confirmada && (
        <Card className="p-4 mb-4 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <p className="text-sm">
            <strong>Estado:</strong> {reserva.estado.replace(/_/g, " ")}.{" "}
            {reserva.estado === "pendiente_validacion" && "Tu pago está siendo revisado."}
            {reserva.estado === "rechazada" && reserva.motivo_rechazo && `Motivo: ${reserva.motivo_rechazo}`}
          </p>
        </Card>
      )}

      {todosUsados && (
        <Card className="p-4 mb-4 border-green-300 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300">
          <p className="text-sm">
            ✓ <strong>Abordaje validado:</strong> Este boleto ha sido validado correctamente por el chofer y el pasajero ya puede abordar el bus.
          </p>
        </Card>
      )}

      <Card className="overflow-hidden">
        {/* Cabecera */}
        <div className="bg-primary text-primary-foreground p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              <span className="font-semibold">{v?.buses?.cooperativas?.nombre}</span>
            </div>
            <Badge className={
              todosUsados
                ? "bg-blue-600 text-white"
                : confirmada
                ? "bg-green-500 text-white"
                : "bg-yellow-400 text-yellow-900"
            }>
              {todosUsados ? "Abordado" : confirmada ? "Confirmado" : "Pendiente"}
            </Badge>
          </div>
          <div className="text-3xl font-bold flex items-center gap-3 flex-wrap">
            {v?.rutas?.ciudad_origen}
            <ArrowRight className="h-6 w-6" />
            {v?.rutas?.ciudad_destino}
          </div>
          {fechaSalida && (
            <p className="text-primary-foreground/80 text-sm mt-1">
              {format(fechaSalida, "EEEE dd MMMM yyyy", { locale: es })} · Salida{" "}
              {fechaSalida.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        {/* Cuerpo */}
        <div className="p-6 grid md:grid-cols-[1fr_auto] gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reserva</p>
              <p className="font-mono text-2xl font-bold">#{reserva.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Número de bus</p>
                <p className="font-medium">{v?.buses?.numero ? `Disco Nº ${v.buses.numero}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Placa del bus</p>
                <p className="font-medium font-mono">{v?.buses?.placa ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de bus</p>
                <p className="font-medium capitalize">{v?.buses?.tipo ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Asiento(s)</p>
                <p className="font-medium">{reserva.asientos?.join(", ") ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total pagado</p>
                <p className="font-medium text-primary">${Number(reserva.precio_total).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* QR */}
          <div className="text-center">
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR del boleto" className="w-40 h-40 mx-auto" />
              : <div className="w-40 h-40 mx-auto bg-muted rounded-md animate-pulse" />
            }
            <p className="text-xs text-muted-foreground mt-2">Muestra este QR al abordar</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/30 flex justify-end">
          <Button onClick={descargarPDF}>
            <Download className="h-4 w-4 mr-2" /> Descargar PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}