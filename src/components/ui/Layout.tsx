import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bus, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export function Layout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { user, signOut } = useAuth();
  const isAdmin = user?.role === "administrador";
  const isOficinista = user?.role === "oficinista";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = (
    <>
      <NavLink to="/buscar" className={({ isActive }) =>
        `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}`
      }>Buscar viajes</NavLink>
      
      {user && (
        <NavLink to="/mis-reservas" className={({ isActive }) =>
          `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}`
        }>Mis reservas</NavLink>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* HEADER / BARRA DE NAVEGACIÓN */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Bus className="h-5 w-5" />
            </div>
            <span className="font-display">BusEcuador</span>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-6">{navLinks}</nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">{(user as any).email}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/mis-reservas')}>Mis reservas</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Ingresar</Button>
                <Button size="sm" onClick={() => navigate('/auth?tab=signup')}>Crear cuenta</Button>
              </>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Menú Móvil Desplegable */}
        {open && (
          <div className="md:hidden border-t border-border/60 bg-background">
            <div className="container py-4 flex flex-col gap-3" onClick={() => setOpen(false)}>
              {navLinks}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/auth')}>Ingresar</Button>
                  <Button size="sm" className="flex-1" onClick={() => navigate('/auth?tab=signup')}>Crear cuenta</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO DE LAS PÁGINAS */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card mt-12">
        <div className="container py-8 text-sm text-muted-foreground flex flex-col md:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} BusEcuador — Sistema de venta de boletos.</p>
          <p>Hecho para cooperativas de transporte del Ecuador.</p>
        </div>
      </footer>
    </div> 
  );
}