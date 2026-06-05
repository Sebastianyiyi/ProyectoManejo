import { useState, useRef } from "react";
import { cooperativaService, subirLogoCooperativa } from "@/lib/cooperativaService";
import { useCooperativa } from "@/contexts/CooperativaContext";
import { useLang } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, X, Loader2, Check } from "lucide-react";

const EMPTY = { nombre: "", ruc: "", ciudad_principal: "", logo_url: "" };

const estadoBadgeClass: Record<string, string> = {
  verificada: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pendiente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  suspendida: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function CooperativaPerfilPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const { cooperativas, cooperativaActiva, seleccionar, refrescar } = useCooperativa();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const estadoLabel = (estado: string) =>
    estado === "verificada" ? t("coop_estado_verificada")
      : estado === "suspendida" ? t("coop_estado_suspendida")
      : t("coop_estado_pendiente");

  const handleLogoFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("buses_upload_invalid"), variant: "destructive" });
      return;
    }
    try {
      setUploadingLogo(true);
      const url = await subirLogoCooperativa(file);
      setForm((prev) => ({ ...prev, logo_url: url }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("buses_upload_error");
      toast({ title: t("buses_upload_error"), description: msg, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRegister = async () => {
    if (!form.nombre.trim()) {
      toast({ title: t("coop_name_required"), variant: "destructive" });
      return;
    }
    if (!form.ruc.trim()) {
      toast({ title: t("coop_ruc_required"), variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const nueva = await cooperativaService.create({
        nombre: form.nombre.trim(),
        ruc: form.ruc.trim(),
        ciudad_principal: form.ciudad_principal.trim() || null,
        logo_url: form.logo_url || null,
      });
      await refrescar();
      seleccionar(nueva.id);
      setForm(EMPTY);
      toast({ title: t("coop_registered") });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : t("coop_register_error");
      toast({ title: t("coop_register_error"), description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("coop_page_title")}</h1>

      {/* Selector de cooperativa activa */}
      <Card className="p-5 space-y-2 max-w-md">
        <Label>{t("coop_active_label")}</Label>
        <Select
          value={cooperativaActiva ? String(cooperativaActiva.id) : ""}
          onValueChange={(v) => seleccionar(Number(v))}
        >
          <SelectTrigger><SelectValue placeholder={t("coop_select_placeholder")} /></SelectTrigger>
          <SelectContent>
            {cooperativas.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Registro de cooperativa */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Building2 size={16} className="text-primary" /> {t("coop_register_title")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>{t("coop_field_name")}</Label>
            <Input value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t("coop_field_ruc")}</Label>
            <Input value={form.ruc} maxLength={13}
              onChange={(e) => setForm({ ...form, ruc: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t("coop_field_city")}</Label>
            <Input value={form.ciudad_principal}
              onChange={(e) => setForm({ ...form, ciudad_principal: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t("coop_field_logo")}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { handleLogoFile(e.target.files?.[0]); e.target.value = ""; }}
            />
            {form.logo_url ? (
              <div className="flex items-center gap-2">
                <img src={form.logo_url} alt="logo" className="h-10 w-10 rounded object-contain border" />
                <Button type="button" variant="outline" size="sm" className="gap-1"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> {t("buses_upload_change")}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive"
                  onClick={() => setForm({ ...form, logo_url: "" })}>
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full gap-2"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}>
                {uploadingLogo
                  ? <><Loader2 size={16} className="animate-spin" /> {t("buses_upload_uploading")}</>
                  : <><Upload size={16} /> {t("buses_upload_hint")}</>}
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleRegister} disabled={saving}>
            {saving ? t("coop_registering") : t("coop_register_btn")}
          </Button>
        </div>
      </Card>

      {/* Tabla de cooperativas */}
      <div>
        <h2 className="text-base font-semibold mb-3">{t("coop_list_title")}</h2>
        {cooperativas.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 border rounded-lg">{t("coop_empty")}</div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_logo")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_name")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_ruc")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_city")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_state")}</th>
                  <th className="text-center px-4 py-3 font-medium">{t("coop_col_action")}</th>
                </tr>
              </thead>
              <tbody>
                {cooperativas.map((c, i) => {
                  const activa = cooperativaActiva?.id === c.id;
                  return (
                    <tr key={c.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="px-4 py-3">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="logo" className="h-8 w-8 rounded object-contain border" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-primary/10 grid place-items-center">
                            <Building2 size={14} className="text-primary" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{c.nombre}</td>
                      <td className="px-4 py-3 font-mono">{c.ruc}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.ciudad_principal ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadgeClass[c.estado] ?? estadoBadgeClass.pendiente}`}>
                          {estadoLabel(c.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {activa ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            <Check size={14} /> {t("coop_active_badge")}
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => seleccionar(c.id)}>
                            {t("coop_use")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
