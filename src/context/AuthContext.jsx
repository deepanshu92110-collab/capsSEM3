import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    authService
      .me()
      .then(({ data }) => setUser(data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    setUser(data.data.user);
    return data.data.user;
  };
  const register = async (values) => {
    const { data } = await authService.register(values);
    return data.data.user;
  };
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
