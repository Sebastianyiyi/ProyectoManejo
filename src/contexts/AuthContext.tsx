import { createContext, useContext, useState } from "react";

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  signOut: () => void;
  hasRole: (role: string) => boolean;
  simulateLogin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signOut = () => setUser(null);

  const hasRole = (role: string) => user?.role === role;

  const simulateLogin = () =>
    setUser({ name: "Juan Pérez", email: "juan@test.com", role: "passenger" });

  return (
    <AuthContext.Provider value={{ user, signOut, hasRole, simulateLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}