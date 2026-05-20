import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, MailCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Contraseña actualizada ✓" });
      navigate("/auth");
    } catch {
      toast({ title: "Error al actualizar la contraseña", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!canReset) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="p-8 max-w-sm w-full text-center space-y-4">
          <MailCheck size={36} className="mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">Enlace no válido</h1>
          <p className="text-sm text-muted-foreground">
            Accede a esta página desde el correo de recuperación que te enviamos.
            El enlace expira en 1 hora.
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Volver al inicio
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
          <h1 className="text-xl font-bold">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">Elige una contraseña segura</p>
        </div>

        <div className="space-y-1">
          <Label>Nueva contraseña</Label>
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
          <Label>Confirmar contraseña</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button onClick={handleReset} disabled={saving} className="w-full">
          {saving ? "Guardando..." : "Confirmar nueva contraseña"}
        </Button>
      </Card>
    </div>
  );
}
