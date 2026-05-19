import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
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
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hasRole = (...roles: string[]) => roles.includes(user?.role ?? "");

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
}