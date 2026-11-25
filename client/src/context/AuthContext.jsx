import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { TOKEN_KEY } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setSettings(data.settings);
      return data.user;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshUser();
    const onUnauthorized = () => clearSession();
    window.addEventListener("lovaction:unauthorized", onUnauthorized);
    return () => window.removeEventListener("lovaction:unauthorized", onUnauthorized);
  }, [refreshUser, clearSession]);

  const login = useCallback(
    async (identifier, password) => {
      const { data } = await api.post("/auth/login", { identifier, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      try {
        const me = await api.get("/auth/me");
        setUser(me.data.user);
        setSettings(me.data.settings);
      } catch {
        // The token is valid; the user payload from login is enough.
      }
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network errors while signing out.
    }
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({
      user,
      settings,
      setSettings,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin" || user?.role === "founder",
      isFounder: user?.role === "founder",
      login,
      logout,
      refreshUser,
      updateUser,
    }),
    [user, settings, loading, login, logout, refreshUser, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
