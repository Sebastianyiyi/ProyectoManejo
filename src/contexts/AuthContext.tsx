import { createContext, useContext, useEffect, useState } from "react";
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
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function getUsuarioFromDatabase(supabaseUser: SupabaseUser): Promise<AppUser> {
  const email = supabaseUser.email ?? "";

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, full_name, email, rol, activo")
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error obteniendo sesión:", error);
          if (mounted) setUser(null);
          return;
        }

        if (!session?.user) {
          if (mounted) setUser(null);
          return;
        }

        const appUser = await getUsuarioFromDatabase(session.user);

        if (mounted) {
          setUser(appUser);
        }
      } catch (error) {
        console.error("Error general en AuthContext:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const handleAuthChange = async () => {
        try {
          if (!session?.user) {
            if (mounted) setUser(null);
            return;
          }

          const appUser = await getUsuarioFromDatabase(session.user);

          if (mounted) {
            setUser(appUser);
          }
        } catch (error) {
          console.error("Error en cambio de sesión:", error);
          if (mounted) setUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      handleAuthChange();
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

  const hasRole = (role: string) => {
    return user?.role === role;
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