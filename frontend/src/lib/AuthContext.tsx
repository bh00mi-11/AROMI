import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api, { authAPI } from "./api";

interface Worker {
  id: number;
  name: string;
  email: string;
  centre_id: string;
  centre_name: string;
  village?: string;
  district?: string;
}

interface AuthCtx {
  worker: Worker | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("aromi_token");
    if (token) {
      // Set header immediately before calling /me
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      authAPI.me()
        .then((r) => setWorker(r.data))
        .catch(() => {
          localStorage.removeItem("aromi_token");
          delete api.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const token = res.data.access_token;
    // Set token in storage AND axios defaults before calling /me
    localStorage.setItem("aromi_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const me = await authAPI.me();
    setWorker(me.data);
  };

  const logout = () => {
    localStorage.removeItem("aromi_token");
    delete api.defaults.headers.common["Authorization"];
    setWorker(null);
  };

  return (
    <AuthContext.Provider value={{ worker, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
