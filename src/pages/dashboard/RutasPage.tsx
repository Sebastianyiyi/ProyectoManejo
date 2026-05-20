import { useEffect, useState, useCallback } from "react";
import { rutasService } from "@/lib/rutasService";
import type { Ruta, RutaInsert } from "@/lib/rutasService";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

const EMPTY_FORM: RutaInsert = {
  ciudad_origen: "",
  ciudad_destino: "",
  distancia_km: null,
  duracion_minutos: null,
};

export default function RutasPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | null>(null);
  const [form, setForm] = useState<RutaInsert>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchRutas = useCallback(async () => {
    try {
      setLoading(true);
      setRutas(await rutasService.getAll());
    } catch {
      toast({ title: "Error al cargar las rutas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchRutas(); }, [fetchRutas]);

  const filtered = rutas.filter((r) =>
    [r.ciudad_origen, r.ciudad_destino]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEditingRuta(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ruta: Ruta) => {
    setEditingRuta(ruta);
    setForm({
      ciudad_origen: ruta.ciudad_origen,
      ciudad_destino: ruta.ciudad_destino,
      distancia_km: ruta.distancia_km,
      duracion_minutos: ruta.duracion_minutos,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.ciudad_origen.trim() || !form.ciudad_destino.trim()) {
      toast({ title: "El origen y destino son obligatorios", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      if (editingRuta) {
        await rutasService.update(editingRuta.id, form);
        toast({ title: "Ruta actualizada correctamente" });
      } else {
        await rutasService.create(form);
        toast({ title: "Ruta registrada correctamente" });
      }
      setModalOpen(false);
      fetchRutas();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast({ title: "Error al guardar", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await rutasService.delete(deleteId);
      toast({ title: "Ruta eliminada correctamente" });
      setDeleteId(null);
      fetchRutas();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar la ruta";
      toast({ title: "Error al eliminar", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("dash_routes")}</h1>
          <p className="text-muted-foreground text-sm">
            {rutas.length} {rutas.length !== 1 ? "rutas registradas" : "ruta registrada"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle size={18} /> Nueva ruta
        </Button>
      </div>

      {/* Buscador */}
      <Input
        placeholder="Buscar por origen o destino..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabla */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando rutas...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No hay rutas registradas</p>
          <p className="text-sm mt-1">Haz clic en "Nueva ruta" para agregar la primera.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {[
                    { label: "ID", center: false },
                    { label: "Ciudad de Origen", center: false },
                    { label: "Ciudad de Destino", center: false },
                    { label: "Distancia (km)", center: false },
                    { label: "Duración (minutos)", center: false },
                    { label: "Acciones", center: true },
                  ].map(({ label, center }) => (
                    <th
                      key={label}
                      className={`px-4 py-3 font-medium text-muted-foreground whitespace-nowrap ${center ? "text-center" : "text-left"}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ruta, i) => (
                  <tr key={ruta.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{ruta.id}</td>
                    <td className="px-4 py-3 font-semibold">{ruta.ciudad_origen}</td>
                    <td className="px-4 py-3 font-semibold">{ruta.ciudad_destino}</td>
                    <td className="px-4 py-3">{ruta.distancia_km ? `${ruta.distancia_km} km` : "—"}</td>
                    <td className="px-4 py-3">{ruta.duracion_minutos ? `${ruta.duracion_minutos} min` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(ruta)}>
                          <Pencil size={15} />
                        </Button>
                        <Button size="icon" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(ruta.id)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRuta ? "Editar ruta" : "Registrar nueva ruta"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Ciudad de origen *</Label>
              <Input placeholder="Ej: Quito"
                value={form.ciudad_origen}
                onChange={(e) => setForm({ ...form, ciudad_origen: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ciudad de destino *</Label>
              <Input placeholder="Ej: Guayaquil"
                value={form.ciudad_destino}
                onChange={(e) => setForm({ ...form, ciudad_destino: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distancia (km)</Label>
                <Input type="number" min={1} placeholder="Ej: 420"
                  value={form.distancia_km || ""}
                  onChange={(e) => setForm({ ...form, distancia_km: parseInt(e.target.value) || null })} />
              </div>
              <div className="space-y-2">
                <Label>Duración (minutos)</Label>
                <Input type="number" min={1} placeholder="Ej: 480"
                  value={form.duracion_minutos || ""}
                  onChange={(e) => setForm({ ...form, duracion_minutos: parseInt(e.target.value) || null })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingRuta ? "Guardar cambios" : "Registrar ruta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los viajes asignados a esta ruta podrían perder su referencia.
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
