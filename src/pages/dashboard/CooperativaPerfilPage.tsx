import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cooperativaService } from "@/lib/cooperativaService";
import type { Cooperativa } from "@/lib/cooperativaService";
import { useTheme } from "@/contexts/ThemeContext";
import type { ThemeColors } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Bus, Map, CalendarClock, Ticket, Clock,
  CheckCircle, AlertCircle, Pencil, X, Save,
} from "lucide-react";

// ─── Paleta predefinida ───────────────────────────────────────────────────────

const PALETTE: { label: string; primary: string; secondary: string }[] = [
  { label: "Azul",     primary: "#2563eb", secondary: "#64748b" },
  { label: "Verde",    primary: "#16a34a", secondary: "#64748b" },
  { label: "Violeta",  primary: "#7c3aed", secondary: "#64748b" },
  { label: "Rojo",     primary: "#dc2626", secondary: "#64748b" },
  { label: "Naranja",  primary: "#ea580c", secondary: "#64748b" },
  { label: "Teal",     primary: "#0d9488", secondary: "#64748b" },
  { label: "Rosa",     primary: "#db2777", secondary: "#64748b" },
  { label: "Índigo",   primary: "#4f46e5", secondary: "#64748b" },
];

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface Stats {
  buses: number;
  rutas: number;
  viajesProgramados: number;
  reservasPendientes: number;
  boletosEmitidos: number;
}

interface ViajeProximo {
  id: number;
  fecha_salida: string;
  precio_base: number;
  rutas: { ciudad_origen: string; ciudad_destino: string } | null;
  buses: { placa: string } | null;
}

interface EditForm {
  nombre: string;
  telefono: string;
  direccion: string;
  logo_url: string;
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

const estadoBadgeClass: Record<string, string> = {
  verificada: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pendiente:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  suspendida: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CooperativaPerfilPage() {
  const { toast } = useToast();
  const { t } = useLang();
  const { colors, setColors, savingColors } = useTheme();

  const [cooperativa, setCooperativa] = useState<Cooperativa | null>(null);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [proximos, setProximos]       = useState<ViajeProximo[]>([]);
  const [loading, setLoading]         = useState(true);

  // Estado de edición de perfil
  const [editMode, setEditMode]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<EditForm>({
    nombre: "", telefono: "", direccion: "", logo_url: "",
  });

  // Estado de edición de colores
  const [draftColors, setDraftColors] = useState<ThemeColors>(colors);

  // ── Carga inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const coop = await cooperativaService.get();
        setCooperativa(coop);
        setForm({
          nombre:    coop.nombre,
          telefono:  coop.telefono ?? "",
          direccion: coop.direccion ?? "",
          logo_url:  coop.logo_url ?? "",
        });

        const [
          { count: buses },
          { count: rutas },
          { count: viajesProg },
          { count: reservasPend },
          { count: boletos },
          { data: proximosViajes },
        ] = await Promise.all([
          supabase.from("buses").select("*", { count: "exact", head: true }).eq("cooperativa_id", coop.id).eq("activo", true),
          supabase.from("rutas").select("*", { count: "exact", head: true }),
          supabase.from("viajes").select("*", { count: "exact", head: true }).eq("estado", "programado"),
          supabase.from("reservas").select("*", { count: "exact", head: true }).eq("estado", "pendiente_pago"),
          supabase.from("boletos").select("*", { count: "exact", head: true }).eq("estado", "activo"),
          supabase
            .from("viajes")
            .select("id, fecha_salida, precio_base, rutas(ciudad_origen, ciudad_destino), buses(placa)")
            .eq("estado", "programado")
            .gte("fecha_salida", new Date().toISOString())
            .order("fecha_salida", { ascending: true })
            .limit(6),
        ]);

        setStats({
          buses:              buses ?? 0,
          rutas:              rutas ?? 0,
          viajesProgramados:  viajesProg ?? 0,
          reservasPendientes: reservasPend ?? 0,
          boletosEmitidos:    boletos ?? 0,
        });
        setProximos((proximosViajes as unknown as ViajeProximo[]) ?? []);
      } catch {
        toast({ title: t("coop_error"), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  // Sincronizar draft cuando cambian colores externos (ej: otro tab)
  useEffect(() => { setDraftColors(colors); }, [colors]);

  // ── Guardar perfil ─────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!cooperativa) return;
    setSaving(true);
    try {
      const updated = await cooperativaService.update(cooperativa.id, {
        nombre:           form.nombre.trim(),
        ruc:              cooperativa.ruc,
        ciudad_principal: cooperativa.ciudad_principal,
        logo_url:         form.logo_url.trim() || null,
        telefono:         form.telefono.trim() || null,
        direccion:        form.direccion.trim() || null,
        color_primario:   cooperativa.color_primario,
        color_secundario: cooperativa.color_secundario,
      });
      setCooperativa(updated);
      setEditMode(false);
      toast({ title: "Perfil actualizado correctamente" });
    } catch {
      toast({ title: "Error al guardar el perfil", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!cooperativa) return;
    setForm({
      nombre:    cooperativa.nombre,
      telefono:  cooperativa.telefono ?? "",
      direccion: cooperativa.direccion ?? "",
      logo_url:  cooperativa.logo_url ?? "",
    });
    setEditMode(false);
  }

  // ── Guardar colores ────────────────────────────────────────────────────────

  async function handleSaveColors() {
    try {
      await setColors(draftColors);
      // Actualizar estado local de cooperativa para reflejar los colores guardados
      setCooperativa((prev) =>
        prev
          ? { ...prev, color_primario: draftColors.primary, color_secundario: draftColors.secondary }
          : prev
      );
      toast({ title: "Colores de tema guardados" });
    } catch {
      toast({ title: "Error al guardar los colores", variant: "destructive" });
    }
  }

  // ── Renders ────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-6 text-muted-foreground text-sm">{t("coop_loading")}</div>;

  if (!cooperativa) return (
    <div className="p-6 text-muted-foreground text-sm">{t("coop_not_found")}</div>
  );

  const estadoLabelKey =
    cooperativa.estado === "verificada"  ? "coop_estado_verificada"  :
    cooperativa.estado === "suspendida"  ? "coop_estado_suspendida"  :
    "coop_estado_pendiente";

  const badgeClass = estadoBadgeClass[cooperativa.estado] ?? estadoBadgeClass.pendiente;

  return (
    <div className="p-6 space-y-6">

      {/* ── Header cooperativa ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {cooperativa.logo_url ? (
            <img
              src={cooperativa.logo_url}
              alt="logo"
              className="h-14 w-14 rounded-lg object-contain border"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-primary/10 grid place-items-center">
              <Bus size={24} className="text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{cooperativa.nombre}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                {t(estadoLabelKey)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              RUC: {cooperativa.ruc}
              {cooperativa.ciudad_principal && ` · ${cooperativa.ciudad_principal}`}
            </p>
            {cooperativa.telefono && (
              <p className="text-sm text-muted-foreground">📞 {cooperativa.telefono}</p>
            )}
            {cooperativa.direccion && (
              <p className="text-sm text-muted-foreground">📍 {cooperativa.direccion}</p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditMode((v) => !v)}
          className="shrink-0"
        >
          {editMode ? <X size={14} className="mr-1" /> : <Pencil size={14} className="mr-1" />}
          {editMode ? "Cancelar" : "Editar perfil"}
        </Button>
      </div>

      {/* ── Formulario de edición ── */}
      {editMode && (
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold">Editar información de la cooperativa</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre de la cooperativa"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                placeholder="+593 99 999 9999"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                placeholder="Av. Principal 123, Ciudad"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="logo_url">URL del logo</Label>
              <Input
                id="logo_url"
                value={form.logo_url}
                onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
              <X size={14} className="mr-1" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveProfile} disabled={saving || !form.nombre.trim()}>
              <Save size={14} className="mr-1" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Estadísticas ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Bus}          label={t("coop_stat_buses")}    value={stats.buses}              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard icon={Map}          label={t("coop_stat_rutas")}    value={stats.rutas}              color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
          <StatCard icon={CalendarClock} label={t("coop_stat_viajes")}  value={stats.viajesProgramados}  color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <StatCard icon={Clock}        label={t("coop_stat_reservas")} value={stats.reservasPendientes} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
          <StatCard icon={Ticket}       label={t("coop_stat_boletos")}  value={stats.boletosEmitidos}    color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        </div>
      )}

      {/* ── Selector de tema de colores ── */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold">Tema de colores</h2>

        {/* Paleta predefinida */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Paleta rápida</p>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((p) => {
              const active = draftColors.primary === p.primary;
              return (
                <button
                  key={p.primary}
                  title={p.label}
                  onClick={() => setDraftColors({ primary: p.primary, secondary: p.secondary })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    active ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ background: p.primary }}
                />
              );
            })}
          </div>
        </div>

        {/* Color picker manual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="color-primary">Color primario</Label>
            <div className="flex items-center gap-2">
              <input
                id="color-primary"
                type="color"
                value={draftColors.primary}
                onChange={(e) => setDraftColors((c) => ({ ...c, primary: e.target.value }))}
                className="w-10 h-9 rounded cursor-pointer border border-input bg-transparent p-0.5"
              />
              <Input
                value={draftColors.primary}
                onChange={(e) => setDraftColors((c) => ({ ...c, primary: e.target.value }))}
                placeholder="#2563eb"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="color-secondary">Color secundario</Label>
            <div className="flex items-center gap-2">
              <input
                id="color-secondary"
                type="color"
                value={draftColors.secondary}
                onChange={(e) => setDraftColors((c) => ({ ...c, secondary: e.target.value }))}
                className="w-10 h-9 rounded cursor-pointer border border-input bg-transparent p-0.5"
              />
              <Input
                value={draftColors.secondary}
                onChange={(e) => setDraftColors((c) => ({ ...c, secondary: e.target.value }))}
                placeholder="#64748b"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
          <div className="flex items-center gap-3">
            <div
              className="h-9 px-4 rounded-md text-white text-sm font-medium grid place-items-center"
              style={{ background: draftColors.primary }}
            >
              Botón primario
            </div>
            <div
              className="h-9 px-4 rounded-md text-white text-sm font-medium grid place-items-center"
              style={{ background: draftColors.secondary }}
            >
              Botón secundario
            </div>
            <div
              className="h-5 w-5 rounded-full border"
              style={{ background: draftColors.primary }}
            />
            <div
              className="h-5 w-5 rounded-full border"
              style={{ background: draftColors.secondary }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSaveColors}
            disabled={savingColors}
          >
            <Save size={14} className="mr-1" />
            {savingColors ? "Guardando..." : "Guardar tema"}
          </Button>
        </div>
      </Card>

      {/* ── Próximos viajes ── */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-primary" />
          {t("coop_upcoming")}
        </h2>
        {proximos.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg">
            <AlertCircle size={16} />
            {t("coop_no_upcoming")}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_route")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_date")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("coop_col_bus")}</th>
                  <th className="text-right px-4 py-3 font-medium">{t("coop_col_price")}</th>
                </tr>
              </thead>
              <tbody>
                {proximos.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-4 py-3 font-medium">
                      {v.rutas?.ciudad_origen} → {v.rutas?.ciudad_destino}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(v.fecha_salida).toLocaleString("es-EC", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.buses?.placa ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">${Number(v.precio_base).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}