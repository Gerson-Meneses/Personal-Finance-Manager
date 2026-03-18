import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../shared/api";
import type { Account } from "../accounts/types";
import type { Category } from "../categories/types";

interface User {
  id: string;
  name: string;
  birthDate: string,
  phone: string,
  country: string | null,
  isAdmin: boolean,
  createdAt: string,
  updatedAt: string,
  accounts: Account[],
  categories: Category[]
}

interface RegisterDto {
  name: string
  birthDate: string,
  phone: string,
  country: string,
  isAdmin: boolean,
  email: string,
  password: string
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()

  const login = async (email: string, password: string) => {
    try {
      const data: { token: string } = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem("token", data.token);
      setToken(data.token);

    } catch (error: any) {
      throw error
    }
  };

  const register = async (registerData: RegisterDto) => {
    try {
      const data: { user: {token: string} } = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(registerData)
      });

      localStorage.setItem("token", data.user.token);
      setToken(data.user.token);

    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate('/login')
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch<any>("/user/me");
        setUser(data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
