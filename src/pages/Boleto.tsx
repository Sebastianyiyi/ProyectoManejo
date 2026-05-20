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

export default function Boleto() {
  const { codigo } = useParams();
  const [reserva, setReserva] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reservas")
        .select(`
          *,
          viajes (
            fecha_salida, fecha_llegada_est, precio_base,
            rutas (ciudad_origen, ciudad_destino, duracion_minutos),
            buses (placa, tipo, cooperativas (nombre))
          )
        `)
        .eq("codigo", codigo!)
        .maybeSingle();

      setReserva(data);

      if (data) {
        const url = await QRCode.toDataURL(
          `BUSEC|${data.codigo}|${data.id}`,
          { width: 320, margin: 1 }
        );
        setQrDataUrl(url);
      }
      setLoading(false);
    })();
  }, [codigo]);

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
    doc.text(`Código: ${reserva.codigo}`, 10, y); y += 7;
    doc.text(`Cooperativa: ${v?.buses?.cooperativas?.nombre ?? ""}`, 10, y); y += 6;
    doc.text(`${v?.rutas?.ciudad_origen} → ${v?.rutas?.ciudad_destino}`, 10, y); y += 6;
    doc.text(`Fecha: ${format(fechaSalida, "dd/MM/yyyy", { locale: es })}`, 10, y); y += 6;
    doc.text(`Hora: ${fechaSalida.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}`, 10, y); y += 6;
    doc.text(`Placa: ${v?.buses?.placa ?? ""}`, 10, y); y += 8;
    doc.text(`Total pagado: $${Number(reserva.total).toFixed(2)}`, 10, y);

    doc.addImage(qrDataUrl, "PNG", 95, 35, 45, 45);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Presenta este código al abordar", 95, 84);
    doc.save(`boleto-${reserva.codigo}.pdf`);
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

      <Card className="overflow-hidden">
        {/* Cabecera */}
        <div className="bg-primary text-primary-foreground p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              <span className="font-semibold">{v?.buses?.cooperativas?.nombre}</span>
            </div>
            <Badge className={confirmada
              ? "bg-green-500 text-white"
              : "bg-yellow-400 text-yellow-900"
            }>
              {confirmada ? "Confirmado" : "Pendiente"}
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Código</p>
              <p className="font-mono text-2xl font-bold">{reserva.codigo}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Placa del bus</p>
                <p className="font-medium">{v?.buses?.placa ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de bus</p>
                <p className="font-medium capitalize">{v?.buses?.tipo ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total pagado</p>
                <p className="font-medium text-primary">${Number(reserva.total).toFixed(2)}</p>
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