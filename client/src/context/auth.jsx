import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? "checking" : "anonymous");

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api("/api/user/me")
      .then((d) => {
        setUser(d.user);
        setStatus("authenticated");
      })
      .catch((err) => (err.status === 401 ? logout() : setStatus("offline")));
  }, [logout]);

  useEffect(() => {
    window.addEventListener("finsight:unauthorized", logout);
    return () => window.removeEventListener("finsight:unauthorized", logout);
  }, [logout]);

  const start = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    setStatus("authenticated");
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      login: (body) => api("/api/auth/login", { method: "POST", body }).then(start),
      register: (body) => api("/api/auth/register", { method: "POST", body }).then(start),
      demo: () => api("/api/auth/demo", { method: "POST" }).then(start),
      setUser,
      logout,
    }),
    [user, status, start, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
