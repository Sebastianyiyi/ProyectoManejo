import { useEffect, useState, useCallback } from "react";
import { viajesService } from "@/lib/rutasService";
import type { ViajeConFrecuencia } from "@/lib/rutasService";
import { frecuenciasService } from "@/lib/frecuenciasService";
import type { Frecuencia } from "@/lib/frecuenciasService";
import { busService } from "@/lib/busService";
import type { Bus } from "@/lib/busService";
import { usuariosService } from "@/lib/usuariosService";
import type { Usuario } from "@/lib/usuariosService";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Pencil, Bus as BusIcon, CalendarDays, Clock, MapPin } from "lucide-react";

// ─── Config visual tipo de bus ────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  economico: "Normal",
  ejecutivo: "VIP",
  premium: "Doble Piso",
};

const ESTADO_BADGE: Record<string, string> = {
  programado:  "bg-blue-100 text-blue-700 border-blue-300",
  en_curso:    "bg-green-100 text-green-700 border-green-300",
  finalizado:  "bg-slate-100 text-slate-600 border-slate-300",
  cancelado:   "bg-red-100 text-red-700 border-red-300",
};

interface FormState {
  frecuencia_id: string;
  bus_id: string;
  chofer_id: string;
  fecha: string;        // YYYY-MM-DD
  hora_salida: string;  // HH:MM (prellenada desde frecuencia)
  precio_base: string;
}

const EMPTY_FORM: FormState = {
  frecuencia_id: "",
  bus_id: "",
  chofer_id: "",
  fecha: "",
  hora_salida: "",
  precio_base: "",
};

export default function RutasPage() {
  const { toast } = useToast();
  const { t } = useLang();

  const [viajes, setViajes] = useState<ViajeConFrecuencia[]>([]);
  const [frecuencias, setFrecuencias] = useState<Frecuencia[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [choferes, setChoferes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingViaje, setEditingViaje] = useState<ViajeConFrecuencia | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ─── Carga de datos ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [v, f, b, u] = await Promise.all([
        viajesService.getAll(),
        frecuenciasService.getAll(),
        busService.getAll(),
        usuariosService.getAll(),
      ]);
      setViajes(v);
      setFrecuencias(f.filter((fr) => fr.activo));
      setBuses(b.filter((bus) => bus.activo));
      setChoferes(u.filter((user) => user.rol === "chofer"));
    } catch {
      toast({ title: "Error al cargar los viajes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Prellenar hora desde frecuencia seleccionada
  const handleFrecuenciaChange = (id: string) => {
    const frec = frecuencias.find((f) => String(f.id) === id);
    setForm((prev) => ({
      ...prev,
      frecuencia_id: id,
      hora_salida: frec?.hora_salida ?? "",
    }));
  };

  const openCreate = () => {
    setEditingViaje(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (v: ViajeConFrecuencia) => {
    setEditingViaje(v);
    const d = new Date(v.fecha_salida);
    const fecha = d.toISOString().split("T")[0];
    const hora = d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false });
    setForm({
      frecuencia_id: String(v.frecuencia_id ?? ""),
      bus_id: String(v.bus_id),
      chofer_id: v.chofer_id ? String(v.chofer_id) : "",
      fecha,
      hora_salida: hora,
      precio_base: String(v.precio_base),
    });
    setModalOpen(true);
  };

  // ─── Filtro ─────────────────────────────────────────────────────────────────

  // Solo viajes con una frecuencia (ruta) definida; se ocultan los antiguos sin ruta.
  const viajesConRuta = viajes.filter((v) => v.frecuencias);
  const filtered = viajesConRuta.filter((v) =>
    [v.frecuencias?.ciudad_origen, v.frecuencias?.ciudad_destino, v.buses?.placa]
      .some((val) => val?.toLowerCase().includes(search.toLowerCase()))
  );

  // ─── Guardar viaje ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.frecuencia_id || !form.bus_id || !form.fecha || !form.precio_base || !form.chofer_id) {
      toast({ title: "Todos los campos son obligatorios", variant: "destructive" });
      return;
    }
    const precio = parseFloat(form.precio_base);
    if (isNaN(precio) || precio <= 0) {
      toast({ title: "Ingresa un precio válido", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const fechaSalida = `${form.fecha}T${form.hora_salida}:00-05:00`;
      if (editingViaje) {
        await viajesService.update(editingViaje.id, {
          frecuencia_id: parseInt(form.frecuencia_id),
          bus_id: parseInt(form.bus_id),
          chofer_id: parseInt(form.chofer_id),
          fecha_salida: fechaSalida,
          precio_base: precio,
        });
        toast({ title: "Viaje actualizado correctamente" });
      } else {
        await viajesService.create({
          frecuencia_id: parseInt(form.frecuencia_id),
          bus_id: parseInt(form.bus_id),
          chofer_id: parseInt(form.chofer_id),
          fecha_salida: fechaSalida,
          precio_base: precio,
        });
        toast({ title: "Viaje programado correctamente" });
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingViaje(null);
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await viajesService.delete(deleteId);
      toast({ title: "Viaje eliminado" });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("dash_routes")}</h1>
          <p className="text-muted-foreground text-sm">
            {viajesConRuta.length} {viajesConRuta.length !== 1 ? "viajes programados" : "viaje programado"}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2"
          disabled={frecuencias.length === 0 || buses.length === 0}
          title={frecuencias.length === 0 ? "Primero registra una frecuencia" : ""}
        >
          <PlusCircle size={18} /> Programar viaje
        </Button>
      </div>

      {/* Aviso si no hay frecuencias */}
      {frecuencias.length === 0 && !loading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No hay frecuencias activas. Ve a <strong>Frecuencias</strong> y registra al menos una antes de programar viajes.
        </div>
      )}

      {/* Buscador */}
      <Input
        placeholder="Buscar por origen, destino o placa..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabla */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando viajes...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="mx-auto mb-3 opacity-30" size={40} />
          <p className="text-lg font-medium">No hay viajes programados</p>
          <p className="text-sm mt-1">
            Selecciona una frecuencia, un bus y una fecha para programar el primer viaje.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {["ID", "Ruta (frecuencia)", "Bus", "Chofer", "Fecha y hora", "Precio", "Estado", "Acciones"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-medium text-muted-foreground whitespace-nowrap ${h === "Acciones" ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => {
                  const frec = v.frecuencias;
                  const bus = v.buses;
                  const chofer = v.chofer;
                  const fechaLocal = new Date(v.fecha_salida).toLocaleString("es-EC", {
                    dateStyle: "medium", timeStyle: "short",
                  });
                  return (
                    <tr key={v.id} className={`border-b last:border-0 ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{v.id}</td>
                      <td className="px-4 py-3">
                        {frec ? (
                          <span className="flex items-center gap-1.5 font-semibold">
                            <MapPin size={13} className="text-muted-foreground shrink-0" />
                            {frec.ciudad_origen} → {frec.ciudad_destino}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {bus ? (
                          <span className="flex items-center gap-1.5">
                            <BusIcon size={13} className="text-muted-foreground" />
                            <span className="font-medium">{bus.placa}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {TIPO_LABEL[bus.tipo] ?? bus.tipo}
                            </Badge>
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {chofer ? (
                          <span className="font-medium">{chofer.full_name}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-muted-foreground" />
                          {fechaLocal}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">${v.precio_base.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${ESTADO_BADGE[v.estado] ?? "bg-muted text-muted-foreground"}`}>
                          {v.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon" variant="ghost"
                            title="Editar viaje"
                            onClick={() => openEdit(v)}
                            disabled={v.estado !== "programado"}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="text-destructive hover:text-destructive"
                            title="Eliminar viaje"
                            onClick={() => setDeleteId(v.id)}
                            disabled={v.estado !== "programado"}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal programar viaje */}
      <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) setEditingViaje(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingViaje ? "Editar viaje" : "Programar nuevo viaje"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {/* Frecuencia */}
            <div className="space-y-2">
              <Label>Frecuencia *</Label>
              <Select value={form.frecuencia_id} onValueChange={handleFrecuenciaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  {frecuencias.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.ciudad_origen} → {f.ciudad_destino} ({f.hora_salida})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bus */}
            <div className="space-y-2">
              <Label>Bus *</Label>
              <Select value={form.bus_id} onValueChange={(v) => setForm({ ...form, bus_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.placa} — {TIPO_LABEL[b.tipo] ?? b.tipo} (cap. {b.capacidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chofer */}
            <div className="space-y-2">
              <Label>Chofer *</Label>
              <Select value={form.chofer_id} onValueChange={(v) => setForm({ ...form, chofer_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un chofer" />
                </SelectTrigger>
                <SelectContent>
                  {choferes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.full_name} ({c.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de salida *</Label>
                <Input
                  type="time"
                  value={form.hora_salida}
                  onChange={(e) => setForm({ ...form, hora_salida: e.target.value })}
                />
              </div>
            </div>

            {/* Costo */}
            <div className="space-y-2">
              <Label>Precio base (USD) *</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="Ej: 4.50"
                value={form.precio_base}
                onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); setEditingViaje(null); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingViaje ? "Guardar cambios" : "Programar viaje"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Solo se pueden eliminar viajes con estado "programado".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
