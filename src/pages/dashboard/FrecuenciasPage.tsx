import { useEffect, useState, useCallback } from "react";
import { frecuenciasService, subirResolucion } from "@/lib/frecuenciasService";
import type { Frecuencia } from "@/lib/frecuenciasService";
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
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle, Pencil, Trash2, ToggleLeft, ToggleRight,
  FileText, Upload, Clock, MapPin,
} from "lucide-react";

interface FormState {
  ciudad_origen: string;
  ciudad_destino: string;
  hora_salida: string;
  resolucion_url: string | null;
  activo: boolean;
}

const EMPTY_FORM: FormState = {
  ciudad_origen: "",
  ciudad_destino: "",
  hora_salida: "",
  resolucion_url: null,
  activo: true,
};

export default function FrecuenciasPage() {
  const { toast } = useToast();
  const [frecuencias, setFrecuencias] = useState<Frecuencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Frecuencia | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchFrecuencias = useCallback(async () => {
    try {
      setLoading(true);
      setFrecuencias(await frecuenciasService.getAll());
    } catch {
      toast({ title: "Error al cargar frecuencias", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchFrecuencias(); }, [fetchFrecuencias]);

  const filtered = frecuencias.filter((f) =>
    [f.ciudad_origen, f.ciudad_destino]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (f: Frecuencia) => {
    setEditing(f);
    setForm({
      ciudad_origen: f.ciudad_origen,
      ciudad_destino: f.ciudad_destino,
      hora_salida: f.hora_salida,
      resolucion_url: f.resolucion_url,
      activo: f.activo,
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const maxMB = 10;
    if (archivo.size > maxMB * 1024 * 1024) {
      toast({ title: `El archivo supera los ${maxMB} MB`, variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      const url = await subirResolucion(archivo);
      setForm((prev) => ({ ...prev, resolucion_url: url }));
      toast({ title: "Resolución subida correctamente" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir el archivo";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.ciudad_origen.trim() || !form.ciudad_destino.trim() || !form.hora_salida) {
      toast({ title: "Origen, destino y hora son obligatorios", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await frecuenciasService.update(editing.id, form);
        toast({ title: "Frecuencia actualizada" });
      } else {
        await frecuenciasService.create(form);
        toast({ title: "Frecuencia registrada" });
      }
      setModalOpen(false);
      fetchFrecuencias();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (f: Frecuencia) => {
    try {
      await frecuenciasService.toggleActivo(f.id, !f.activo);
      toast({ title: f.activo ? "Frecuencia desactivada" : "Frecuencia activada" });
      fetchFrecuencias();
    } catch {
      toast({ title: "Error al cambiar estado", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await frecuenciasService.delete(deleteId);
      toast({ title: "Frecuencia eliminada" });
      setDeleteId(null);
      fetchFrecuencias();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Frecuencias</h1>
          <p className="text-muted-foreground text-sm">
            {frecuencias.length} {frecuencias.length !== 1 ? "frecuencias registradas" : "frecuencia registrada"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle size={18} /> Nueva frecuencia
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
        <p className="text-muted-foreground text-sm">Cargando frecuencias...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="mx-auto mb-3 opacity-30" size={40} />
          <p className="text-lg font-medium">No hay frecuencias registradas</p>
          <p className="text-sm mt-1">Haz clic en "Nueva frecuencia" para agregar la primera.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {["ID", "Origen", "Destino", "Hora salida", "Resolución", "Estado", "Acciones"].map((h) => (
                    <th key={h} className={`px-4 py-3 font-medium text-muted-foreground whitespace-nowrap ${h === "Acciones" ? "text-center" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.id} className={`border-b last:border-0 ${i % 2 !== 0 ? "bg-muted/20" : ""}`}>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{f.id}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-muted-foreground" />
                        {f.ciudad_origen}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary" />
                        {f.ciudad_destino}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-muted-foreground" />
                        {f.hora_salida}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.resolucion_url ? (
                        <a
                          href={f.resolucion_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          <FileText size={13} /> Ver documento
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin resolución</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={f.activo ? "default" : "secondary"}>
                        {f.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(f)}>
                          <Pencil size={15} />
                        </Button>
                        <Button size="icon" variant="ghost" title={f.activo ? "Desactivar" : "Activar"} onClick={() => handleToggle(f)}>
                          {f.activo ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} />}
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          title="Eliminar"
                          onClick={() => setDeleteId(f.id)}
                        >
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
            <DialogTitle>{editing ? "Editar frecuencia" : "Registrar nueva frecuencia"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad de origen *</Label>
                <Input
                  placeholder="Ej: Quito"
                  value={form.ciudad_origen}
                  onChange={(e) => setForm({ ...form, ciudad_origen: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ciudad de destino *</Label>
                <Input
                  placeholder="Ej: Ibarra"
                  value={form.ciudad_destino}
                  onChange={(e) => setForm({ ...form, ciudad_destino: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hora de salida *</Label>
              <Input
                type="time"
                value={form.hora_salida}
                onChange={(e) => setForm({ ...form, hora_salida: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Resolución de agencia</Label>
              {form.resolucion_url ? (
                <div className="flex items-center gap-2">
                  <a
                    href={form.resolucion_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs flex items-center gap-1 hover:underline"
                  >
                    <FileText size={13} /> Ver documento actual
                  </a>
                  <Button
                    variant="ghost" size="sm" className="text-muted-foreground h-6 text-xs"
                    onClick={() => setForm({ ...form, resolucion_url: null })}
                  >
                    Quitar
                  </Button>
                </div>
              ) : null}
              <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-md px-3 py-2 hover:bg-muted/40 transition-colors">
                <Upload size={15} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Subiendo..." : "Subir PDF / imagen (máx. 10 MB)"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar frecuencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta frecuencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los viajes programados con esta frecuencia perderán la referencia.
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
