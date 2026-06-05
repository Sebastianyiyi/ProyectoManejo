import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Bus, LayoutDashboard, Map, Users, LogOut, Building2, Settings, Clock, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout() {
  const { user, loading, signOut, hasRole } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const NAV = [
    { to: "/dashboard",             label: t("dash_home"),        icon: LayoutDashboard, end: true },
    { to: "/dashboard/cooperativa", label: t("dash_cooperative"), icon: Building2 },
    { to: "/dashboard/buses",        label: t("dash_buses"),       icon: Bus },
    { to: "/dashboard/frecuencias",   label: "Frecuencias",         icon: Clock },
    { to: "/dashboard/rutas",         label: t("dash_routes"),      icon: Map },
    { to: "/dashboard/boletos",       label: "Boletos",             icon: Ticket },
    { to: "/dashboard/usuarios",      label: t("dash_users"),       icon: Users, adminOnly: true },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center">{t("dash_welcome")}...</div>;

  if (!loading && (!user || (!hasRole("administrador") && !hasRole("oficinista")))) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col bg-muted/20">
        <div className="p-4 border-b">
          <p className="font-bold text-sm">{t("dash_panel")}</p>
          <p className="text-xs text-muted-foreground truncate">{user.name}</p>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
            {user.role}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.filter(item => !item.adminOnly || hasRole("administrador")).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => navigate("/configuracion")}
          >
            <Settings size={16} /> {t("nav_settings")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut size={16} /> {t("nav_logout")}
          </Button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
