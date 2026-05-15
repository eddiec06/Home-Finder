import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        setToken(null);
        setUser(null);
      });
  }, []);

  const completeLogin = (token, u) => {
    setToken(token);
    setUser(u);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (_) {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, completeLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
