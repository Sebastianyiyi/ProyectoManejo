import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { validarCedulaEcuador } from "@/lib/cedula";

const signInSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(3, "Mínimo 3 caracteres").max(100),
  cedula: z.string().trim().refine(validarCedulaEcuador, "Cédula ecuatoriana inválida"),
  phone: z.string().trim().regex(/^\d{7,15}$/, "Teléfono inválido"),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialTab = params.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState(initialTab);
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "administrador" || user.role === "oficinista") {
        navigate("/dashboard", { replace: true });
        return;
      }

      const from = (location.state as any)?.from || "/";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const signIn = useForm({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "" } });
  const signUp = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { full_name: "", cedula: "", phone: "", email: "", password: "" },
  });

  const onSignIn = async (values: z.infer<typeof signInSchema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Credenciales inválidas" : error.message);
      return;
    }
    toast.success("Bienvenido");
  };

  const onSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: values.full_name,
          cedula: values.cedula,
          phone: values.phone,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cuenta creada. Ya puedes ingresar.");
    setTab("signin");
  };

  return (
    <div className="container max-w-md py-12">
      <Card className="p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-1">Bienvenido a BusEcuador</h1>
        <p className="text-sm text-muted-foreground mb-6">Ingresa o crea tu cuenta para comprar boletos.</p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Ingresar</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn.handleSubmit(onSignIn)} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="si-email">Correo</Label>
                <Input id="si-email" type="email" {...signIn.register("email")} />
                {signIn.formState.errors.email && <p className="text-xs text-destructive">{signIn.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="si-password">Contraseña</Label>
                <Input id="si-password" type="password" {...signIn.register("password")} />
                {signIn.formState.errors.password && <p className="text-xs text-destructive">{signIn.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Ingresar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp.handleSubmit(onSignUp)} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Nombre completo</Label>
                <Input id="su-name" {...signUp.register("full_name")} />
                {signUp.formState.errors.full_name && <p className="text-xs text-destructive">{signUp.formState.errors.full_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="su-cedula">Cédula</Label>
                  <Input id="su-cedula" maxLength={10} {...signUp.register("cedula")} />
                  {signUp.formState.errors.cedula && <p className="text-xs text-destructive">{signUp.formState.errors.cedula.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-phone">Teléfono</Label>
                  <Input id="su-phone" {...signUp.register("phone")} />
                  {signUp.formState.errors.phone && <p className="text-xs text-destructive">{signUp.formState.errors.phone.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email">Correo</Label>
                <Input id="su-email" type="email" {...signUp.register("email")} />
                {signUp.formState.errors.email && <p className="text-xs text-destructive">{signUp.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-password">Contraseña</Label>
                <Input id="su-password" type="password" {...signUp.register("password")} />
                {signUp.formState.errors.password && <p className="text-xs text-destructive">{signUp.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Crear cuenta
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Las cuentas de oficinista, chofer y administrador se crean desde el panel de administración.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
