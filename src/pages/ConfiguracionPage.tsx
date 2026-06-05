import { useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import type { Lang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCooperativa } from "@/contexts/CooperativaContext";
import { subirLogoCooperativa } from "@/lib/cooperativaService";
import type { Cooperativa } from "@/lib/cooperativaService";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Globe, Bell, User, ChevronRight, KeyRound, Building2, Upload, X, Loader2 } from "lucide-react";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        on ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Sección visible solo para el admin: personaliza la app con los datos de la cooperativa.
function CoopConfigCard({ coop }: { coop: Cooperativa }) {
  const { actualizar } = useCooperativa();
  const { t } = useLang();
  const { toast } = useToast();
  const [form, setForm] = useState({
    nombre: coop.nombre,
    ruc: coop.ruc,
    ciudad_principal: coop.ciudad_principal ?? "",
    logo_url: coop.logo_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("buses_upload_invalid"), variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      const url = await subirLogoCooperativa(file);
      setForm((prev) => ({ ...prev, logo_url: url }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("buses_upload_error");
      toast({ title: t("buses_upload_error"), description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast({ title: t("coop_name_required"), variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      await actualizar({
        nombre: form.nombre.trim(),
        ruc: form.ruc.trim(),
        ciudad_principal: form.ciudad_principal.trim() || null,
        logo_url: form.logo_url || null,
      });
      toast({ title: t("config_coop_saved") });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : t("config_coop_error");
      toast({ title: t("config_coop_error"), description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={16} />
        <h2 className="font-semibold">{t("config_coop_title")}</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">{t("config_coop_desc")}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>{t("coop_field_name")}</Label>
          <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>{t("coop_field_ruc")}</Label>
          <Input value={form.ruc} maxLength={13} onChange={(e) => setForm({ ...form, ruc: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>{t("coop_field_city")}</Label>
          <Input value={form.ciudad_principal} onChange={(e) => setForm({ ...form, ciudad_principal: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>{t("coop_field_logo")}</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => { handleLogo(e.target.files?.[0]); e.target.value = ""; }}
          />
          {form.logo_url ? (
            <div className="flex items-center gap-2">
              <img src={form.logo_url} alt="logo" className="h-10 w-10 rounded object-contain border" />
              <Button type="button" variant="outline" size="sm" className="gap-1"
                disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> {t("buses_upload_change")}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive"
                onClick={() => setForm({ ...form, logo_url: "" })}>
                <X size={14} />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full gap-2"
              disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading
                ? <><Loader2 size={16} className="animate-spin" /> {t("buses_upload_uploading")}</>
                : <><Upload size={16} /> {t("buses_upload_hint")}</>}
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("config_saving") : t("config_save")}
        </Button>
      </div>
    </Card>
  );
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const { cooperativa } = useCooperativa();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("notifications") !== "false"
  );
  const [sendingReset, setSendingReset] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  const handleToggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("notifications", String(next));
  };

  const handlePasswordReset = async () => {
    try {
      setSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: lang === "es" ? "Correo enviado ✓" : "Email sent ✓",
        description: lang === "es"
          ? "Revisa tu bandeja de entrada para continuar"
          : "Check your inbox to continue",
      });
    } catch {
      toast({ title: lang === "es" ? "Error al enviar el correo" : "Error sending email", variant: "destructive" });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("config_title")}</h1>
        <p className="text-muted-foreground text-sm">
          {lang === "es" ? "Preferencias personales de la plataforma" : "Personal platform preferences"}
        </p>
      </div>

      {/* Cooperativa (solo admin) */}
      {user.role === "administrador" && cooperativa && (
        <CoopConfigCard coop={cooperativa} />
      )}

      {/* Apariencia */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          <h2 className="font-semibold">{t("config_appearance")}</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("config_dark")}</p>
            <p className="text-xs text-muted-foreground">{t("config_dark_desc")}</p>
          </div>
          <Toggle on={theme === "dark"} onToggle={toggleTheme} />
        </div>
      </Card>

      {/* Idioma */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={16} />
          <h2 className="font-semibold">{t("config_language")}</h2>
        </div>
        <div className="flex gap-2">
          {(["es", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                lang === l
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {l === "es" ? "Español" : "English"}
            </button>
          ))}
        </div>
      </Card>

      {/* Notificaciones */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={16} />
          <h2 className="font-semibold">{t("config_notifications")}</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("config_notifications")}</p>
            <p className="text-xs text-muted-foreground">{t("config_notif_desc")}</p>
          </div>
          <Toggle on={notifications} onToggle={handleToggleNotifications} />
        </div>
      </Card>

      {/* Perfil */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User size={16} />
          <h2 className="font-semibold">{t("config_profile")}</h2>
        </div>

        <div className="text-sm space-y-0.5">
          <p className="font-medium text-base">{user.name}</p>
          <p className="text-muted-foreground">{user.email}</p>
          <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize mt-1">
            {user.role}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/perfil")}
          >
            <User size={14} />
            {lang === "es" ? "Editar datos" : "Edit profile"}
            <ChevronRight size={14} className="ml-auto" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={sendingReset}
            onClick={handlePasswordReset}
          >
            <KeyRound size={14} />
            {sendingReset
              ? (lang === "es" ? "Enviando..." : "Sending...")
              : (lang === "es" ? "Cambiar contraseña" : "Change password")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
