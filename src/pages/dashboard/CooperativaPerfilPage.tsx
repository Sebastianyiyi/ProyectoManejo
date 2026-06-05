import { useCooperativa } from "@/contexts/CooperativaContext";
import { useLang } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Building2, Settings } from "lucide-react";

const estadoBadgeClass: Record<string, string> = {
  verificada: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pendiente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  suspendida: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function CooperativaPerfilPage() {
  const { t } = useLang();
  const { cooperativa, loading } = useCooperativa();

  if (loading) {
    return <div className="p-6 text-muted-foreground text-sm">{t("coop_loading")}</div>;
  }

  if (!cooperativa) {
    return <div className="p-6 text-muted-foreground text-sm">{t("coop_not_found")}</div>;
  }

  const coop = cooperativa;
  const estadoLabel = coop.estado === "verificada"
    ? t("coop_estado_verificada")
    : coop.estado === "suspendida"
    ? t("coop_estado_suspendida")
    : t("coop_estado_pendiente");
  const badgeClass = estadoBadgeClass[coop.estado] ?? estadoBadgeClass.pendiente;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("coop_page_title")}</h1>

      <Card className="p-6 space-y-6 max-w-2xl">
        <div className="flex items-start gap-4">
          {coop.logo_url ? (
            <img src={coop.logo_url} alt="logo" className="h-20 w-20 rounded-lg object-contain border" />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-primary/10 grid place-items-center">
              <Building2 size={32} className="text-primary" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{coop.nombre}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                {estadoLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">RUC: {coop.ruc}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{t("coop_field_name")}</p>
            <p className="font-medium">{coop.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("coop_field_ruc")}</p>
            <p className="font-medium">{coop.ruc}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("coop_field_city")}</p>
            <p className="font-medium">{coop.ciudad_principal ?? "—"}</p>
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
          <Settings size={14} /> {t("coop_edit_hint")}
        </p>
      </Card>
    </div>
  );
}
