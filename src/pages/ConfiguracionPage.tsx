import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import type { Lang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Globe, Bell, User, ChevronRight, KeyRound } from "lucide-react";

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
