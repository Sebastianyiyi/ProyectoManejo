import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import type { Lang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Globe, Bell, User, Save, Eye, EyeOff } from "lucide-react";

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

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("notifications") !== "false"
  );
  const [name, setName] = useState(user?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  const handleToggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem("notifications", String(next));
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ title: t("config_name_required"), variant: "destructive" });
      return;
    }
    if (password && password !== confirmPassword) {
      toast({ title: t("config_password_mismatch"), variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      if (user.id) {
        await supabase
          .from("usuarios")
          .update({ full_name: name })
          .eq("id", user.id);
      }
      if (password) {
        await supabase.auth.updateUser({ password });
      }
      toast({ title: t("config_saved") });
      setPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("config_title")}</h1>
        <p className="text-muted-foreground text-sm">
          {lang === "es"
            ? "Preferencias personales de la plataforma"
            : "Personal platform preferences"}
        </p>
      </div>

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

        <div className="space-y-1">
          <Label>{t("config_name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>{t("config_photo")}</Label>
          <Input
            placeholder="https://..."
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          {photoUrl && (
            <img
              src={photoUrl}
              alt="preview"
              className="mt-2 h-14 w-14 rounded-full object-cover border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

        <div className="space-y-1">
          <Label>{t("config_password")}</Label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {password && (
          <div className="space-y-1">
            <Label>{t("config_confirm_password")}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            <Save size={16} />
            {saving ? t("config_saving") : t("config_save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
