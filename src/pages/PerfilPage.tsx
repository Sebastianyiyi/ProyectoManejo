import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: t("perfil_name_required"), variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      if (user.id) {
        const { error } = await supabase
          .from("usuarios")
          .update({ full_name: name })
          .eq("id", user.id);
        if (error) throw error;
      }
      toast({ title: t("perfil_saved") });
    } catch {
      toast({ title: t("perfil_error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 -ml-2">
          <ArrowLeft size={16} /> {t("perfil_back")}
        </Button>
        <h1 className="text-xl font-bold">{t("perfil_title")}</h1>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-1">
          <Label>{t("perfil_email")}</Label>
          <Input value={user.email} readOnly className="bg-muted/40 cursor-default" />
        </div>

        <div className="space-y-1">
          <Label>{t("perfil_name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("perfil_name_placeholder")}
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save size={16} />
            {saving ? t("perfil_saving") : t("perfil_save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
