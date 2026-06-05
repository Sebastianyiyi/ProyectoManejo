import { useEffect, useState, useCallback, useRef } from "react";
import { busService, subirFotoBus, MARCAS_CHASIS, MARCAS_CARROCERIA } from "@/lib/busService";
import type { Bus, BusInsert, TipoBus } from "@/lib/busService";
import { validarPlacaEcuador } from "@/lib/placa";
import { useLang } from "@/contexts/LanguageContext";
import { useCooperativa } from "@/contexts/CooperativaContext";
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
import { PlusCircle, Pencil, Trash2, Power, Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";

// ── Importar el nuevo configurador de asientos ──────────────────────────────
import {
  SeatConfigurator,
  defaultSeatConfig,
  type SeatConfiguratorValue,
  type AsientoConfig,
} from "@/components/ui/SeatConfigurator";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
//  Guardar asientos en Supabase
// ─────────────────────────────────────────────

async function guardarAsientos(busId: number, asientos: AsientoConfig[]) {
  if (asientos.length === 0) return;

  // 1. Obtener asientos existentes del bus
  const { data: existentes, error: fetchErr } = await supabase
    .from("asientos")
    .select("id, numero")
    .eq("bus_id", busId);
  if (fetchErr) throw fetchErr;

  const existenteMap = new Map<number, number>(
    (existentes ?? []).map((e: any) => [e.numero, e.id])
  );
  const nuevosNumeros = new Set(asientos.map((a) => a.numero));

  // 2. Actualizar los que ya existen
  for (const a of asientos.filter((a) => existenteMap.has(a.numero))) {
    const { error } = await supabase
      .from("asientos")
      .update({ fila: a.fila, columna: a.columna, piso: a.piso, activo: a.activo })
      .eq("id", existenteMap.get(a.numero)!);
    if (error) throw error;
  }

  // 3. Insertar los nuevos
  const toInsert = asientos.filter((a) => !existenteMap.has(a.numero));
  if (toInsert.length > 0) {
    const rows = toInsert.map((a) => ({
      bus_id: busId,
      numero: a.numero,
      fila: a.fila,
      columna: a.columna,
      piso: a.piso,
      activo: a.activo,
    }));
    const { error } = await supabase.from("asientos").insert(rows);
    if (error) throw error;
  }

  // 4. Desactivar los que ya no están en la nueva config (NO eliminar, respeta FK)
  const idsADesactivar = (existentes ?? [])
    .filter((e: any) => !nuevosNumeros.has(e.numero))
    .map((e: any) => e.id);
  if (idsADesactivar.length > 0) {
    const { error } = await supabase
      .from("asientos")
      .update({ activo: false })
      .in("id", idsADesactivar);
    if (error) throw error;
  }
}

// ─────────────────────────────────────────────
//  Form
// ─────────────────────────────────────────────

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
  const { t } = useLang();
  const { cooperativa } = useCooperativa();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [seatConfig, setSeatConfig] = useState<SeatConfiguratorValue>(
    defaultSeatConfig()
  );
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic lists of brands initialized from defaults and localStorage
  const [chasisBrands, setChasisBrands] = useState<string[]>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("custom_marcas_chasis") : null;
    const custom = stored ? JSON.parse(stored) : [];
    return Array.from(new Set([...MARCAS_CHASIS, ...custom]));
  });
  const [carroceriaBrands, setCarroceriaBrands] = useState<string[]>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("custom_marcas_carroceria") : null;
    const custom = stored ? JSON.parse(stored) : [];
    return Array.from(new Set([...MARCAS_CARROCERIA, ...custom]));
  });

  // Dialog state for adding a new brand
  const [newBrandModalOpen, setNewBrandModalOpen] = useState(false);
  const [newBrandType, setNewBrandType] = useState<"chasis" | "carroceria" | null>(null);
  const [newBrandName, setNewBrandName] = useState("");

  const fetchBuses = useCallback(async () => {
    try {
      const data = await busService.getAll();
      setBuses(data);

      // Extract unique brands from Supabase buses
      const dbChasis = data.map((b) => b.marca_chasis).filter(Boolean) as string[];
      const dbCarroceria = data.map((b) => b.marca_carroceria).filter(Boolean) as string[];

      // Fetch custom brands from localStorage
      const storedChasis = localStorage.getItem("custom_marcas_chasis");
      const customChasis = storedChasis ? JSON.parse(storedChasis) : [];

      const storedCarroceria = localStorage.getItem("custom_marcas_carroceria");
      const customCarroceria = storedCarroceria ? JSON.parse(storedCarroceria) : [];

      // Combine all unique brands
      setChasisBrands(Array.from(new Set([...MARCAS_CHASIS, ...dbChasis, ...customChasis])));
      setCarroceriaBrands(Array.from(new Set([...MARCAS_CARROCERIA, ...dbCarroceria, ...customCarroceria])));
    } catch {
      toast({ title: t("buses_error_load"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const openAddBrandModal = (type: "chasis" | "carroceria") => {
    setNewBrandType(type);
    setNewBrandName("");
    setNewBrandModalOpen(true);
  };

  const handleAddBrand = () => {
    const trimmed = newBrandName.trim();
    if (!trimmed) {
      toast({ title: t("buses_add_brand_empty"), variant: "destructive" });
      return;
    }

    if (newBrandType === "chasis") {
      if (chasisBrands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
        toast({ title: t("buses_add_brand_exists"), variant: "destructive" });
        return;
      }
      const newBrands = [...chasisBrands, trimmed];
      setChasisBrands(newBrands);
      const stored = localStorage.getItem("custom_marcas_chasis");
      const custom = stored ? JSON.parse(stored) : [];
      localStorage.setItem("custom_marcas_chasis", JSON.stringify(Array.from(new Set([...custom, trimmed]))));
      setForm((prev) => ({ ...prev, marca_chasis: trimmed }));
    } else if (newBrandType === "carroceria") {
      if (carroceriaBrands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
        toast({ title: t("buses_add_brand_exists"), variant: "destructive" });
        return;
      }
      const newBrands = [...carroceriaBrands, trimmed];
      setCarroceriaBrands(newBrands);
      const stored = localStorage.getItem("custom_marcas_carroceria");
      const custom = stored ? JSON.parse(stored) : [];
      localStorage.setItem("custom_marcas_carroceria", JSON.stringify(Array.from(new Set([...custom, trimmed]))));
      setForm((prev) => ({ ...prev, marca_carroceria: trimmed }));
    }

    setNewBrandModalOpen(false);
    toast({ title: t("buses_add_brand_success") });
  };

  useEffect(() => { fetchBuses(); }, [fetchBuses, cooperativa?.id]);

  const filtered = buses.filter((b) =>
    [b.placa, b.numero, b.marca_chasis, b.marca_carroceria]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEditingBus(null);
    setForm(EMPTY_FORM);
    setSeatConfig(defaultSeatConfig());
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
    // Al editar, inicializamos con la config por defecto del tipo del bus.
    // Idealmente aquí se cargarían los asientos existentes desde Supabase.
    setSeatConfig(defaultSeatConfig());
    setModalOpen(true);
  };

  const handleTipoChange = (nuevoTipo: TipoBus) => {
    setForm((prev) => ({ ...prev, tipo: nuevoTipo }));
  };

  // Cuando cambia el seat config, sincronizamos capacidad
  const handleSeatConfigChange = (cfg: SeatConfiguratorValue) => {
    setSeatConfig(cfg);
    const capacidad = cfg.asientos_piso1 + (cfg.doble_piso ? cfg.asientos_piso2 : 0);
    setForm((prev) => ({ ...prev, capacidad }));
  };

  const handleSave = async () => {
    if (!form.placa.trim()) {
      toast({ title: t("buses_plate_required"), variant: "destructive" });
      return;
    }
    if (!validarPlacaEcuador(form.placa)) {
      toast({ title: t("buses_plate_invalid"), variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      if (editingBus) {
        await busService.update(editingBus.id, { ...form, capacidad: seatConfig.asientos_piso1 + (seatConfig.doble_piso ? seatConfig.asientos_piso2 : 0) });
        await guardarAsientos(editingBus.id, seatConfig.asientos);
        toast({ title: t("buses_updated") });
      } else {
        const nuevoBus = await busService.create({
          ...form,
          capacidad: seatConfig.asientos_piso1 + (seatConfig.doble_piso ? seatConfig.asientos_piso2 : 0),
        });
        await guardarAsientos(nuevoBus.id, seatConfig.asientos);
        toast({ title: t("buses_created") });
      }
      setModalOpen(false);
      fetchBuses();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("buses_error_save");
      toast({ title: t("buses_error_save"), description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFotoFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("buses_upload_invalid"), variant: "destructive" });
      return;
    }
    try {
      setUploadingFoto(true);
      const url = await subirFotoBus(file);
      setForm((prev) => ({ ...prev, foto_url: url }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("buses_upload_error");
      toast({ title: t("buses_upload_error"), description: msg, variant: "destructive" });
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleToggle = async (bus: Bus) => {
    const nuevoEstado = !bus.activo;
    try {
      setTogglingId(bus.id);
      await busService.toggleActivo(bus.id, nuevoEstado);
      setBuses((prev) =>
        prev.map((b) => b.id === bus.id ? { ...b, activo: nuevoEstado } : b)
      );
      toast({ title: `Bus ${t(nuevoEstado ? "buses_active" : "buses_inactive").toLowerCase()} ✓` });
    } catch {
      toast({ title: t("buses_error_toggle"), variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await busService.delete(deleteId);
      toast({ title: t("buses_deleted") });
      setDeleteId(null);
      fetchBuses();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("buses_error_delete");
      toast({ title: t("buses_error_delete"), description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("buses_title")}</h1>
          <p className="text-muted-foreground text-sm">
            {buses.length} {buses.length !== 1 ? t("buses_count_plural") : t("buses_count_singular")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle size={18} /> {t("buses_new")}
        </Button>
      </div>

      {/* Buscador */}
      <Input
        placeholder={t("buses_search_placeholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabla */}
      {loading ? (
        <p className="text-muted-foreground text-sm">{t("buses_loading")}</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">{t("buses_empty_title")}</p>
          <p className="text-sm mt-1">{t("buses_empty_desc")}</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {[
                    { label: t("buses_col_num"), center: false },
                    { label: t("buses_col_plate"), center: false },
                    { label: t("buses_col_name"), center: false },
                    { label: t("buses_col_type"), center: false },
                    { label: t("buses_col_capacity"), center: false },
                    { label: t("buses_col_chassis"), center: false },
                    { label: t("buses_col_body"), center: false },
                    { label: t("buses_col_status"), center: false },
                    { label: t("buses_col_photo"), center: true },
                    { label: t("buses_col_actions"), center: true },
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
                {filtered.map((bus, i) => (
                  <tr key={bus.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-4 py-3 font-mono">{bus.numero ?? "—"}</td>
                    <td className="px-4 py-3 font-mono font-semibold">{bus.placa}</td>
                    <td className="px-4 py-3">{cooperativa?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{bus.tipo}</td>
                    <td className="px-4 py-3">{bus.capacidad}</td>
                    <td className="px-4 py-3">{bus.marca_chasis ?? "—"}</td>
                    <td className="px-4 py-3">{bus.marca_carroceria ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={bus.activo ? "default" : "secondary"}>
                        {bus.activo ? t("buses_active") : t("buses_inactive")}
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
                            {t("buses_see")}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs inline-block">{t("buses_no_image")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(bus)}>
                          <Pencil size={15} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={togglingId === bus.id}
                          onClick={() => handleToggle(bus)}
                        >
                          <Power
                            size={15}
                            className={bus.activo ? "text-green-600" : "text-muted-foreground"}
                          />
                        </Button>
                        <Button size="icon" variant="ghost"
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

      {/* ── Modal crear / editar ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        {/* Ampliado a max-w-3xl para dar espacio al configurador de asientos */}
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBus ? t("buses_modal_edit") : t("buses_modal_create")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* ── Datos del bus ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("buses_label_plate")}</Label>
                <Input placeholder="Ej: ABC-1234"
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
              </div>

              <div className="space-y-1">
                <Label>{t("buses_label_type")}</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => handleTipoChange(v as TipoBus)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economico">{t("buses_type_economico")}</SelectItem>
                    <SelectItem value="ejecutivo">{t("buses_type_ejecutivo")}</SelectItem>
                    <SelectItem value="premium">{t("buses_type_premium")}</SelectItem>
                    <SelectItem value="doble_piso">{t("buses_type_doble_piso")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Capacidad — ahora de solo lectura (calculada desde los asientos) */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  {t("buses_label_capacity")}
                  <span className="text-[10px] text-muted-foreground font-normal">(auto)</span>
                </Label>
                <Input
                  type="number"
                  value={form.capacidad}
                  readOnly
                  className="bg-muted/40 cursor-not-allowed"
                  title="La capacidad se calcula automáticamente desde los asientos activos"
                />
              </div>

              <div className="space-y-1">
                <Label>{t("buses_label_chassis")}</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={form.marca_chasis ?? ""}
                      onValueChange={(v) => setForm({ ...form, marca_chasis: v })}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder={t("buses_select_brand")} /></SelectTrigger>
                      <SelectContent>
                        {chasisBrands.map((marca) => (
                          <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openAddBrandModal("chasis")}
                    className="shrink-0"
                    title={t("buses_add_brand_title_chasis")}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label>{t("buses_label_body")}</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={form.marca_carroceria ?? ""}
                      onValueChange={(v) => setForm({ ...form, marca_carroceria: v })}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder={t("buses_select_brand")} /></SelectTrigger>
                      <SelectContent>
                        {carroceriaBrands.map((marca) => (
                          <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openAddBrandModal("carroceria")}
                    className="shrink-0"
                    title={t("buses_add_brand_title_body")}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <Label>{t("buses_label_photo")}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    handleFotoFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {form.foto_url ? (
                  <div className="relative rounded-md border bg-muted/20 p-2">
                    <img
                      src={form.foto_url}
                      alt="bus"
                      className="mx-auto max-h-40 object-contain rounded"
                    />
                    <div className="flex justify-center gap-2 mt-2">
                      <Button type="button" variant="outline" size="sm" className="gap-1"
                        disabled={uploadingFoto}
                        onClick={() => fileInputRef.current?.click()}>
                        <Upload size={14} /> {t("buses_upload_change")}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive"
                        onClick={() => setForm({ ...form, foto_url: "" })}>
                        <X size={14} /> {t("buses_upload_remove")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingFoto}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFotoFile(e.dataTransfer.files?.[0]);
                    }}
                    className="w-full flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-muted/10 py-6 text-muted-foreground hover:bg-muted/20 transition-colors disabled:opacity-60"
                  >
                    {uploadingFoto ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm">{t("buses_upload_uploading")}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span className="text-sm">{t("buses_upload_hint")}</span>
                        <span className="text-xs">{t("buses_upload_formats")}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Separador ── */}
            <div className="border-t pt-4">
              {/* ── Configurador de asientos ── */}
              <SeatConfigurator
                value={seatConfig}
                onChange={handleSeatConfigChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t("buses_cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("buses_saving") : editingBus ? t("buses_save_edit") : t("buses_save_create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview foto */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) { setPreviewImage(null); setPreviewError(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("buses_preview_title")}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="overflow-hidden rounded-md border bg-muted/20 p-4">
              <img
                src={previewImage}
                alt={t("buses_preview_title")}
                className="w-full max-h-[70vh] object-contain"
                onLoad={() => setPreviewError(null)}
                onError={() => setPreviewError("error")}
              />
              {previewError ? (
                <div className="mt-4 text-center">
                  <p className="text-sm text-destructive">{t("buses_img_error")}</p>
                  <p className="text-xs text-muted-foreground break-all mt-2">{previewImage}</p>
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
            <AlertDialogTitle>{t("buses_delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("buses_delete_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("buses_cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("buses_delete_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para agregar una nueva marca */}
      <Dialog open={newBrandModalOpen} onOpenChange={setNewBrandModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {newBrandType === "chasis"
                ? t("buses_add_brand_title_chasis")
                : t("buses_add_brand_title_body")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-brand-name-input">{t("buses_add_brand_label")}</Label>
              <Input
                id="new-brand-name-input"
                placeholder={t("buses_add_brand_placeholder")}
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddBrand();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBrandModalOpen(false)}>
              {t("buses_cancel")}
            </Button>
            <Button onClick={handleAddBrand}>
              {t("buses_add_brand_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
