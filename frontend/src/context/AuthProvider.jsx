import { useCallback, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "../api";
import { AuthContext } from "./authContext";

/*
 * Real authentication: the backend issues a JWT on login/register. The token
 * is kept in localStorage and sent with every API request (see api.js).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only "loading" if a saved token must be checked with the server.
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!getToken()) return undefined;
    let active = true;
    api("/auth/me")
      .then((data) => active && setUser(data.user))
      .catch(() => {
        /* 401 already cleared the token; a network error keeps it for later */
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // api.js fires this when the server says the token is no longer valid.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, []);

  const register = useCallback(async (details) => {
    const data = await api("/auth/register", { method: "POST", body: details });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isLoggedIn: Boolean(user),
      loading,
      register,
      login,
      logout,
      updateUser: setUser,
    }),
    [user, loading, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
