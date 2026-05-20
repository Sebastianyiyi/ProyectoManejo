import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { validarCedulaEcuador } from "@/lib/cedula";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialTab = params.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState(initialTab);
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const signInSchema = z.object({
    email: z.string().trim().email(t("auth_err_email")).max(255),
    password: z.string().min(6, t("auth_err_password")).max(100),
  });

  const signUpSchema = z.object({
    full_name: z.string().trim().min(3, t("auth_err_name")).max(100),
    cedula: z.string().trim().refine(validarCedulaEcuador, t("auth_err_cedula")),
    phone: z.string().trim().regex(/^\d{7,15}$/, t("auth_err_phone")),
    email: z.string().trim().email(t("auth_err_email")).max(255),
    password: z.string().min(6, t("auth_err_password")).max(100),
  });

  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === "chofer") {
        navigate("/chofer", { replace: true });
        return;
      }

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

  const onForgotPassword = async () => {
    const email = signIn.getValues("email").trim();
    if (!email) {
      toast.error(t("auth_forgot_no_email"));
      return;
    }
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast.error(t("auth_forgot_error"));
      return;
    }
    toast.success(t("auth_forgot_sent"));
  };

  const onSignIn = async (values: z.infer<typeof signInSchema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? t("auth_invalid_credentials") : error.message);
      return;
    }
    toast.success(t("auth_welcome"));
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
    toast.success(t("auth_created"));
    setTab("signin");
  };

  return (
    <div className="container max-w-md py-12">
      <Card className="p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-1">{t("auth_title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("auth_subtitle")}</p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{t("auth_signin")}</TabsTrigger>
            <TabsTrigger value="signup">{t("auth_signup")}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn.handleSubmit(onSignIn)} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="si-email">{t("auth_email")}</Label>
                <Input id="si-email" type="email" {...signIn.register("email")} />
                {signIn.formState.errors.email && <p className="text-xs text-destructive">{signIn.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="si-password">{t("auth_password")}</Label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    disabled={sendingReset}
                    className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    {sendingReset && <Loader2 className="h-3 w-3 animate-spin" />}
                    {t("auth_forgot")}
                  </button>
                </div>
                <Input id="si-password" type="password" {...signIn.register("password")} />
                {signIn.formState.errors.password && <p className="text-xs text-destructive">{signIn.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {t("auth_signin")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp.handleSubmit(onSignUp)} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">{t("auth_name")}</Label>
                <Input id="su-name" {...signUp.register("full_name")} />
                {signUp.formState.errors.full_name && <p className="text-xs text-destructive">{signUp.formState.errors.full_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="su-cedula">{t("auth_cedula")}</Label>
                  <Input id="su-cedula" maxLength={10} {...signUp.register("cedula")} />
                  {signUp.formState.errors.cedula && <p className="text-xs text-destructive">{signUp.formState.errors.cedula.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-phone">{t("auth_phone")}</Label>
                  <Input id="su-phone" {...signUp.register("phone")} />
                  {signUp.formState.errors.phone && <p className="text-xs text-destructive">{signUp.formState.errors.phone.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email">{t("auth_email")}</Label>
                <Input id="su-email" type="email" {...signUp.register("email")} />
                {signUp.formState.errors.email && <p className="text-xs text-destructive">{signUp.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-password">{t("auth_password")}</Label>
                <Input id="su-password" type="password" {...signUp.register("password")} />
                {signUp.formState.errors.password && <p className="text-xs text-destructive">{signUp.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {t("auth_signup")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t("auth_admin_note")}
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
