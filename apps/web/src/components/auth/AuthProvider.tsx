"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "../../../lib/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the existing session when AVIA loads.
  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest<{ user: AuthUser }>("/auth/me")
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Authenticate an existing account.
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiRequest<{
        user: AuthUser;
        token: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", response.token);
      localStorage.removeItem("accessToken");
      setUser(response.user);
    },
    []
  );

  // Create an account and establish its session.
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await apiRequest<{
        user: AuthUser;
        token: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      localStorage.setItem("token", response.token);
      localStorage.removeItem("accessToken");
      setUser(response.user);
    },
    []
  );

  // Save profile changes and update the shared account state.
  const updateProfile = useCallback(async (name: string) => {
    const response = await apiRequest<{
      message: string;
      user: AuthUser;
    }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });

    setUser(response.user);
  }, []);

  // End the local session.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, loading, login, register, updateProfile, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}