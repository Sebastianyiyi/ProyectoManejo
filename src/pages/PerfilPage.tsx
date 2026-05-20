import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" });
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
      toast({ title: "Nombre actualizado ✓" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 -ml-2">
          <ArrowLeft size={16} /> Volver
        </Button>
        <h1 className="text-xl font-bold">Editar perfil</h1>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-1">
          <Label>Correo electrónico</Label>
          <Input value={user.email} readOnly className="bg-muted/40 cursor-default" />
        </div>

        <div className="space-y-1">
          <Label>Nombre completo</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
