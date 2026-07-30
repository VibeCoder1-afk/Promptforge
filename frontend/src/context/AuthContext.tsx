import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/api";

type User = { id: string; name: string; email: string; avatarColor: string; team: string | null };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pf_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("pf_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("pf_token", res.data.token);
    setUser(res.data.user);
  }

  // Hits the self-provisioning demo endpoint instead of a hardcoded email/password,
  // so it works even if the demo account hasn't been seeded on this deployment yet.
  async function loginDemo() {
    const res = await api.post("/auth/demo");
    localStorage.setItem("pf_token", res.data.token);
    setUser(res.data.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("pf_token", res.data.token);
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("pf_token");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, loginDemo, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
