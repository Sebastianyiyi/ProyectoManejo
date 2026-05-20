import { useEffect, useState, useCallback } from "react";
import { busService } from "@/lib/busService";
import type { Bus, BusInsert, TipoBus } from "@/lib/busService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Power, Image as ImageIcon } from "lucide-react";

const EMPTY_FORM: Omit<BusInsert, "cooperativa_id" | "numero"> = {
  placa: "",
  capacidad: 40,
  tipo: "economico",
  marca_chasis: "",
  marca_carroceria: "",
  foto_url: "",
  activo: true,
};

export default function BusesPage() {
  const { toast } = useToast();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchBuses = useCallback(async () => {
    try {
      setLoading(true);
      setBuses(await busService.getAll());
    } catch {
      toast({ title: "Error al cargar buses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchBuses(); }, [fetchBuses]);

  const filtered = buses.filter((b) =>
    [b.placa, b.numero, b.marca_chasis, b.marca_carroceria]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEditingBus(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (bus: Bus) => {
    setEditingBus(bus);
    setForm({
      placa: bus.placa,
      capacidad: bus.capacidad,
      tipo: bus.tipo,
      marca_chasis: bus.marca_chasis ?? "",
      marca_carroceria: bus.marca_carroceria ?? "",
      foto_url: bus.foto_url ?? "",
      activo: bus.activo,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.placa.trim()) {
      toast({ title: "La placa es obligatoria", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      if (editingBus) {
        await busService.update(editingBus.id, form);
        toast({ title: "Bus actualizado correctamente ✓" });
      } else {
        await busService.create(form);
        toast({ title: "Bus registrado correctamente ✓" });
      }
      setModalOpen(false);
      fetchBuses();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al guardar", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (bus: Bus) => {
    const nuevoEstado = !bus.activo;
    try {
      setTogglingId(bus.id);
      await busService.toggleActivo(bus.id, nuevoEstado);

      setBuses((prev) =>
        prev.map((b) =>
          b.id === bus.id ? { ...b, activo: nuevoEstado } : b
        )
      );

      toast({ title: `Bus ${nuevoEstado ? "activado" : "desactivado"} ✓` });
    } catch {
      toast({ title: "Error al cambiar estado", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await busService.delete(deleteId);
      toast({ title: "Bus eliminado ✓" });
      setDeleteId(null);
      fetchBuses();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al eliminar", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Buses</h1>
          <p className="text-muted-foreground text-sm">
            {buses.length} bus{buses.length !== 1 ? "es" : ""} registrado{buses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle size={18} /> Nuevo bus
        </Button>
      </div>

      {/* Buscador */}
      <Input
        placeholder="Buscar por placa, número, chasis o carrocería..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabla */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando buses...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No hay buses registrados</p>
          <p className="text-sm mt-1">Haz clic en "Nuevo bus" para agregar el primero.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {["N°", "Placa", "Tipo", "Capacidad", "Chasis", "Carrocería", "Estado", "Foto", "Acciones"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-medium text-muted-foreground whitespace-nowrap ${h === "Foto" || h === "Acciones" ? "text-center" : "text-left"
                        }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((bus, i) => (
                  <tr key={bus.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 py-3 font-mono">{bus.numero ?? "—"}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{bus.placa}</td>
                    <td className="px-4 py-3 capitalize">{bus.tipo}</td>
                    <td className="px-4 py-3">{bus.capacidad}</td>
                    <td className="px-4 py-3">{bus.marca_chasis ?? "—"}</td>
                    <td className="px-4 py-3">{bus.marca_carroceria ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={bus.activo ? "default" : "secondary"}>
                        {bus.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bus.foto_url ? (
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setPreviewImage(bus.foto_url!)}
                          >
                            <ImageIcon size={14} />
                            Ver bus
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs inline-block">Sin imagen</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(bus)}>
                          <Pencil size={15} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={togglingId === bus.id}
                          title={bus.activo ? "Desactivar" : "Activar"}
                          onClick={() => handleToggle(bus)}
                        >
                          <Power
                            size={15}
                            className={bus.activo ? "text-green-600" : "text-muted-foreground"}
                          />
                        </Button>
                        <Button size="icon" variant="ghost" title="Eliminar"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(bus.id)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal crear / editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBus ? "Editar bus" : "Registrar nuevo bus"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Placa *</Label>
              <Input placeholder="Ej: ABC-1234"
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoBus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="economico">Económico</SelectItem>
                  <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Capacidad (asientos)</Label>
              <Input type="number" min={1}
                value={form.capacidad}
                onChange={(e) => setForm({ ...form, capacidad: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1">
              <Label>Marca del chasis</Label>
              <Input placeholder="Ej: Volvo, Mercedes"
                value={form.marca_chasis ?? ""}
                onChange={(e) => setForm({ ...form, marca_chasis: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Marca de carrocería</Label>
              <Input placeholder="Ej: Busscar, Marcopolo"
                value={form.marca_carroceria ?? ""}
                onChange={(e) => setForm({ ...form, marca_carroceria: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>URL de foto (opcional)</Label>
              <Input placeholder="https://..."
                value={form.foto_url ?? ""}
                onChange={(e) => setForm({ ...form, foto_url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingBus ? "Guardar cambios" : "Registrar bus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) { setPreviewImage(null); setPreviewError(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vista previa del bus</DialogTitle>
          </DialogHeader>

          {previewImage && (
            <div className="overflow-hidden rounded-md border bg-muted/20 p-4">
              <img
                src={previewImage}
                alt="Foto del bus"
                className="w-full max-h-[70vh] object-contain"
                onLoad={() => setPreviewError(null)}
                onError={() => setPreviewError("error")}
              />

              {previewError ? (
                <div className="mt-4 text-center">
                  <p className="text-sm text-destructive">No se pudo cargar la imagen.</p>
                  <p className="text-xs text-muted-foreground break-all mt-2">{previewImage}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esto suele pasar porque la URL no apunta a un archivo de imagen directo o el sitio externo bloquea la visualización.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este bus?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si el bus tiene viajes o reservas asociadas, considera desactivarlo en su lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}