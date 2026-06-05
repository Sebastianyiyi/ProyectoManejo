import { useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface GeminiResult {
  esCedulaEcuatoriana: boolean;
  tieneDiscapacidad: boolean;
  confianza: "alta" | "media" | "baja";
  detalle: string;
}

// ─── OCR via Supabase Edge Function (Gemini 2.5 Flash) ─────────────────────────
async function analizarCedulaConGemini(base64: string, mimeType: string): Promise<GeminiResult> {
  const { data, error } = await supabase.functions.invoke("analizar-cedula", {
    body: { base64, mimeType },
  });

  // En 422 (no es cédula ecuatoriana), el SDK puede poner el body en error.context
  // dependiendo de la versión. Intentamos extraerlo de ambos lugares.
  if (error && !data) {
    // Intentar parsear desde error.context si existe
    try {
      const contextData =
        typeof error.context?.json === "function"
          ? await error.context.json()
          : null;
      if (contextData && typeof contextData.esCedulaEcuatoriana === "boolean") {
        return contextData as GeminiResult;
      }
    } catch {
      // context no era JSON parseable
    }
    throw new Error("No se pudo conectar con el servidor de análisis.");
  }

  return data as GeminiResult;
}

// ─── Convertir File a base64 ────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Componente principal ───────────────────────────────────────────────────────
export default function PerfilPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  // Estado OCR cédula
  const [cedulaFile, setCedulaFile] = useState<File | null>(null);
  const [cedulaPreview, setCedulaPreview] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultadoOCR, setResultadoOCR] = useState<GeminiResult | null>(null);
  const [discapacidadGuardada, setDiscapacidadGuardada] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Navigate to="/auth" replace />;

  const isPassenger = hasRole("passenger");

  // ── Guardar nombre ────────────────────────────────────────────────────────────
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

  // ── Selección de imagen ───────────────────────────────────────────────────────
  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCedulaFile(file);
    setCedulaPreview(URL.createObjectURL(file));
    setResultadoOCR(null);
    setDiscapacidadGuardada(false);
  };

  // ── Análisis con Gemini ───────────────────────────────────────────────────────
  const handleAnalizarCedula = async () => {
    if (!cedulaFile) return;
    try {
      setAnalizando(true);
      setResultadoOCR(null);
      const base64 = await fileToBase64(cedulaFile);
      // Fallback explícito: string vacío también se reemplaza
      const mimeType = cedulaFile.type || "image/jpeg";

      const resultado = await analizarCedulaConGemini(base64, mimeType);
      setResultadoOCR(resultado);

      if (!resultado.esCedulaEcuatoriana) {
        toast({
          title: "Documento no válido",
          description:
            resultado.detalle ??
            "La imagen no corresponde a una cédula ecuatoriana. Por favor sube una foto de tu cédula de identidad.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error al analizar la cédula",
        description:
          "No se pudo procesar la imagen. Intenta con una foto más clara o revisa tu conexión.",
        variant: "destructive",
      });
    } finally {
      setAnalizando(false);
    }
  };

  // ── Guardar resultado en DB ───────────────────────────────────────────────────
  const handleGuardarDiscapacidad = async () => {
    if (!resultadoOCR || !user.id) return;
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ tiene_discapacidad: resultadoOCR.tieneDiscapacidad })
        .eq("id", user.id);
      if (error) throw error;
      setDiscapacidadGuardada(true);
      toast({
        title: resultadoOCR.tieneDiscapacidad
          ? "✅ Descuento por discapacidad activado"
          : "Información actualizada",
        description: resultadoOCR.tieneDiscapacidad
          ? "Se aplicará el 50% de descuento en tus próximas compras."
          : "No se detectó discapacidad registrada en la cédula.",
      });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  // ── Resetear sección cédula ───────────────────────────────────────────────────
  const handleReset = () => {
    setCedulaFile(null);
    setCedulaPreview(null);
    setResultadoOCR(null);
    setDiscapacidadGuardada(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confianzaColor: Record<GeminiResult["confianza"], string> = {
    alta: "text-green-600",
    media: "text-yellow-600",
    baja: "text-red-500",
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 -ml-2">
          <ArrowLeft size={16} /> {t("perfil_back")}
        </Button>
        <h1 className="text-xl font-bold">{t("perfil_title")}</h1>
      </div>

      {/* ── Datos básicos ──────────────────────────────────────────────────────── */}
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

      {/* ── Verificación discapacidad (solo pasajeros) ─────────────────────────── */}
      {isPassenger && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-primary" />
            <h2 className="font-semibold text-base">Verificación de Discapacidad</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sube una foto de tu cédula ecuatoriana. Detectaremos automáticamente si tienes
            discapacidad registrada y activaremos el <strong>50% de descuento</strong> en tus
            boletos.
          </p>

          {/* Área de carga */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {cedulaPreview ? (
              <img
                src={cedulaPreview}
                alt="Vista previa cédula"
                className="max-h-40 mx-auto rounded object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                <Upload size={28} />
                <span className="text-sm font-medium">Haz clic para subir tu cédula</span>
                <span className="text-xs">JPG, PNG o WEBP · máx. 5MB</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCedulaChange}
          />

          {/* Botón analizar */}
          {cedulaFile && !resultadoOCR && (
            <Button onClick={handleAnalizarCedula} disabled={analizando} className="w-full gap-2">
              {analizando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analizando cédula con Gemini…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Analizar cédula
                </>
              )}
            </Button>
          )}

          {/* Resultado OCR */}
          {resultadoOCR && (
            <div
              className={`rounded-lg border p-4 space-y-2 ${
                resultadoOCR.esCedulaEcuatoriana && resultadoOCR.tieneDiscapacidad
                  ? "bg-green-50 border-green-200"
                  : resultadoOCR.esCedulaEcuatoriana
                  ? "bg-muted/40 border-border"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {resultadoOCR.esCedulaEcuatoriana ? (
                  resultadoOCR.tieneDiscapacidad ? (
                    <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                  ) : (
                    <XCircle size={18} className="text-muted-foreground shrink-0" />
                  )
                ) : (
                  <XCircle size={18} className="text-red-500 shrink-0" />
                )}
                <span className="font-medium text-sm">
                  {!resultadoOCR.esCedulaEcuatoriana
                    ? "Documento no reconocido como cédula ecuatoriana"
                    : resultadoOCR.tieneDiscapacidad
                    ? "Discapacidad detectada — 50% de descuento"
                    : "No se detectó discapacidad en la cédula"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">{resultadoOCR.detalle}</p>
              <p className={`text-xs pl-6 font-medium ${confianzaColor[resultadoOCR.confianza]}`}>
                Confianza del análisis: {resultadoOCR.confianza}
              </p>

              {/* Solo mostrar botón de guardar si fue una cédula válida */}
              {resultadoOCR.esCedulaEcuatoriana && !discapacidadGuardada && (
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleGuardarDiscapacidad}
                  variant={resultadoOCR.tieneDiscapacidad ? "default" : "outline"}
                >
                  {resultadoOCR.tieneDiscapacidad ? "Activar descuento" : "Confirmar sin descuento"}
                </Button>
              )}

              {discapacidadGuardada && (
                <div className="flex items-center gap-2 pt-1 pl-6 text-green-600 text-sm font-medium">
                  <CheckCircle2 size={14} />
                  Guardado correctamente
                </div>
              )}
            </div>
          )}

          {/* Subir otra imagen */}
          {resultadoOCR && (
            <button
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground w-full text-center"
              onClick={handleReset}
            >
              Subir otra imagen
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
