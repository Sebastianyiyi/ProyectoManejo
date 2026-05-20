import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, MailCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setCanReset(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password) return;
    if (password !== confirm) {
      toast({ title: t("reset_mismatch"), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t("reset_min"), variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: t("reset_success") });
      navigate("/auth");
    } catch {
      toast({ title: t("reset_error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!canReset) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="p-8 max-w-sm w-full text-center space-y-4">
          <MailCheck size={36} className="mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">{t("reset_invalid_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("reset_invalid_desc")}</p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            {t("reset_go_home")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="p-8 max-w-sm w-full space-y-5">
        <div className="text-center space-y-1">
          <Lock size={28} className="mx-auto text-primary" />
          <h1 className="text-xl font-bold">{t("reset_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("reset_subtitle")}</p>
        </div>

        <div className="space-y-1">
          <Label>{t("reset_new_password")}</Label>
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

        <div className="space-y-1">
          <Label>{t("reset_confirm")}</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button onClick={handleReset} disabled={saving} className="w-full">
          {saving ? t("reset_saving") : t("reset_submit")}
        </Button>
      </Card>
    </div>
  );
}
