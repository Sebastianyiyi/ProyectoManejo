import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCooperativaActivaId } from "@/lib/cooperativaActiva";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, CheckCircle, XCircle, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTADOS = [
  "Todos",
  "pendiente_pago",
  "pendiente_validacion",
  "confirmada",
  "rechazada",
  "cancelada",
  "expirada"
];

const ESTADO_LABEL: Record<string, { text: string; variant: "outline" | "secondary" | "default" | "destructive" }> = {
  pendiente_pago: { text: "Pendiente de pago", variant: "outline" },
  pendiente_validacion: { text: "Validando pago", variant: "secondary" },
  confirmada: { text: "Confirmada", variant: "default" },
  rechazada: { text: "Rechazada", variant: "destructive" },
  cancelada: { text: "Cancelada", variant: "outline" },
  expirada: { text: "Expirada", variant: "outline" },
};

export default function BoletosPage() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  
  const [validatingBoleto, setValidatingBoleto] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchBoletos = async () => {
      try {
        const coopId = getCooperativaActivaId();
        if (!coopId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("reservas")
          .select(`
            *,
            viajes!inner (
              fecha_salida,
              buses!inner (
                cooperativa_id,
                placa
              ),
              frecuencias (
                ciudad_origen,
                ciudad_destino
              )
            ),
            perfiles (
              nombre,
              apellidos,
              email
            )
          `)
          .eq("viajes.buses.cooperativa_id", coopId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReservas(data ?? []);
      } catch (err) {
        toast({ title: "Error al cargar historial", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchBoletos();
  }, [toast]);

  const handleActualizarEstado = async (id: number, nuevoEstado: string) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("reservas")
        .update({ estado: nuevoEstado })
        .eq("id", id);
        
      if (error) throw error;
      
      setReservas((prev) => 
        prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r)
      );
      toast({ title: "Estado actualizado exitosamente" });
      setValidatingBoleto(null);
    } catch (error) {
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = reservas.filter((r) => {
    if (estadoFiltro !== "Todos" && r.estado !== estadoFiltro) return false;
    
    const searchLower = search.toLowerCase();
    const cliente = `${r.perfiles?.nombre ?? ""} ${r.perfiles?.apellidos ?? ""}`.toLowerCase();
    const origen = r.viajes?.frecuencias?.ciudad_origen?.toLowerCase() ?? "";
    const destino = r.viajes?.frecuencias?.ciudad_destino?.toLowerCase() ?? "";
    const boletoId = String(r.id);

    return (
      cliente.includes(searchLower) ||
      origen.includes(searchLower) ||
      destino.includes(searchLower) ||
      boletoId.includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial de Boletos</h1>
          <p className="text-muted-foreground text-sm">
            Consulta y filtra el historial de boletos reservados y vendidos
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, cliente, origen o destino..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 max-w-xs">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado === "Todos" ? "Todos los estados" : (ESTADO_LABEL[estado]?.text ?? estado)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/10">
          <p className="text-lg font-medium">No se encontraron boletos</p>
          <p className="text-sm mt-1">Ajusta los filtros de búsqueda</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Fecha Emisión</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Ruta / Frecuencia</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  {hasRole("oficinista") && (
                    <th className="px-4 py-3 font-medium text-muted-foreground text-center">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const est = ESTADO_LABEL[r.estado] ?? { text: r.estado, variant: "outline" };
                  const v = r.viajes;
                  const f = v?.frecuencias;
                  const fechaEmision = new Date(r.created_at);
                  const clienteNombre = `${r.perfiles?.nombre ?? ""} ${r.perfiles?.apellidos ?? ""}`.trim() || "Usuario anónimo";

                  return (
                    <tr key={r.id} className={`border-b last:border-0 ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
                      <td className="px-4 py-3 font-mono text-muted-foreground">#{r.id}</td>
                      <td className="px-4 py-3">
                        {format(fechaEmision, "dd MMM yyyy, HH:mm", { locale: es })}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {clienteNombre}
                        <div className="text-xs text-muted-foreground font-normal">{r.perfiles?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {f ? `${f.ciudad_origen} → ${f.ciudad_destino}` : "—"}
                        <div className="text-xs text-muted-foreground">
                          {v?.fecha_salida ? format(new Date(v.fecha_salida), "dd MMM, HH:mm", { locale: es }) : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        ${Number(r.precio_total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={est.variant}>{est.text}</Badge>
                      </td>
                      {hasRole("oficinista") && (
                        <td className="px-4 py-3 text-center">
                          {(r.estado === "pendiente_validacion" || r.estado === "pendiente_pago") ? (
                            <Button size="sm" variant="outline" onClick={() => setValidatingBoleto(r)}>
                              <FileText className="h-4 w-4 mr-1" /> Validar
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de Validación */}
      <Dialog open={!!validatingBoleto} onOpenChange={(open) => !open && setValidatingBoleto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validar Boleto #{validatingBoleto?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/20 rounded-md border text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{validatingBoleto?.perfiles?.nombre} {validatingBoleto?.perfiles?.apellidos}</span>
                <span className="text-muted-foreground">Total a pagar:</span>
                <span className="font-bold text-primary">${Number(validatingBoleto?.precio_total).toFixed(2)}</span>
                <span className="text-muted-foreground">Ruta:</span>
                <span>{validatingBoleto?.viajes?.frecuencias?.ciudad_origen} → {validatingBoleto?.viajes?.frecuencias?.ciudad_destino}</span>
                <span className="text-muted-foreground">Fecha del viaje:</span>
                <span>{validatingBoleto?.viajes?.fecha_salida ? format(new Date(validatingBoleto.viajes.fecha_salida), "dd MMM yyyy, HH:mm", { locale: es }) : "—"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Verificación de Comprobante / Factura</h3>
              {validatingBoleto?.comprobante_url ? (
                <div className="border rounded-md p-2 bg-muted/10 text-center">
                  <a href={validatingBoleto.comprobante_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm flex justify-center items-center gap-1">
                    <FileText className="h-4 w-4" /> Ver comprobante subido
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground p-3 border rounded-md bg-muted/10">
                  El usuario no ha subido comprobante digital o pagó en efectivo. Verifique el pago en el sistema bancario o físicamente antes de confirmar.
                </p>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-2">
              Al confirmar, el boleto pasará a estado "Confirmada" y el usuario podrá descargar su boleto.
            </p>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button 
              variant="destructive" 
              onClick={() => handleActualizarEstado(validatingBoleto.id, "rechazada")}
              disabled={isUpdating}
            >
              <XCircle className="h-4 w-4 mr-2" /> Rechazar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={() => handleActualizarEstado(validatingBoleto.id, "confirmada")}
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Aprobar y Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
