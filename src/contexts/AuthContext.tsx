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
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserWithRole(su: SupabaseUser): Promise<User> {
  const { data } = await supabase
    .from("usuarios")
    .select("full_name, rol")
    .eq("email", su.email)
    .single();

  return {
    name: data?.full_name ?? su.user_metadata?.full_name ?? su.email ?? "",
    email: su.email ?? "",
    role: data?.rol ?? "passenger",
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
  const [user, setUser] = useState<User | null>(null);
  // loading empieza en true y solo se pone false cuando TODO está listo
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && !ignore) {
        try {
          const u = await fetchUserWithRole(session.user);
          if (!ignore) setUser(u);
        } catch {
          if (!ignore) setUser({
            name: session.user.user_metadata?.full_name ?? session.user.email ?? "",
            email: session.user.email ?? "",
            role: "passenger",
          });
        }
      }

      if (!ignore) setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchUserWithRole(session.user)
            .then((u) => {
              setUser(u);
            })
            .catch(() => {
              setUser({
                name: session.user!.user_metadata?.full_name ?? session.user!.email ?? "",
                email: session.user!.email ?? "",
                role: "passenger",
              });
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      ignore = true;
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

  const hasRole = (...roles: string[]) => roles.includes(user?.role ?? "");
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}