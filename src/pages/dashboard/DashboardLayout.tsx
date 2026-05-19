import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bus, LayoutDashboard, Map, Users, Ticket, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Inicio", icon: LayoutDashboard, end: true },
  { to: "/dashboard/buses", label: "Buses", icon: Bus },
  { to: "/dashboard/rutas", label: "Rutas", icon: Map },
  { to: "/dashboard/usuarios", label: "Usuarios", icon: Users },
  { to: "/dashboard/boletos", label: "Boletos", icon: Ticket },
];

export default function DashboardLayout() {
  const { user, loading, signOut, hasRole } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

  // Solo redirigir si YA terminó de cargar y no tiene rol
  if (!loading && (!user || (!hasRole("administrador") && !hasRole("oficinista")))) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col bg-muted/20">
        <div className="p-4 border-b">
          <p className="font-bold text-sm">Panel de gestión</p>
          <p className="text-xs text-muted-foreground truncate">{user.name}</p>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
            {user.role}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
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

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut size={16} /> Cerrar sesión
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