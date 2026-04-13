import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../../shared/api";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem("token") // lazy init, mejor práctica
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
    setTokenState(newToken);
  };

  // Solo hidrata el usuario al montar o cuando cambia el token
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<User>("/user/me")
      .then(setUser)
      .catch(() => setToken(null)) // token inválido → limpiar
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}