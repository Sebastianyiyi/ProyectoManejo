import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AppUser {
  id: number | null;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function getUsuarioFromDatabase(supabaseUser: SupabaseUser): Promise<AppUser> {
  const email = supabaseUser.email ?? "";

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, full_name, email, rol")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Error consultando la tabla usuarios:", error);
  }

  return {
    id: data?.id ?? null,
    name: data?.full_name ?? supabaseUser.user_metadata?.full_name ?? email,
    email: data?.email ?? email,
    role: data?.rol ?? supabaseUser.user_metadata?.role ?? "passenger",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Escucha todos los cambios de sesión (incluyendo la carga inicial)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Usamos setTimeout(0) para evitar el deadlock con async en onAuthStateChange
      setTimeout(async () => {
        try {
          const appUser = await getUsuarioFromDatabase(session.user);
          if (mounted) {
            setUser(appUser);
          }
        } catch (err) {
          console.error("Error cargando usuario:", err);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hasRole = (...roles: string[]) => {
    return roles.includes(user?.role ?? "");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}