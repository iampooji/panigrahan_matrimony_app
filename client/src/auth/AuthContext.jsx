import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = decodeToken(token);
  // Clear token if expired
  if (!payload || payload.exp * 1000 < Date.now()) {
    localStorage.removeItem("token");
    return null;
  }
  return token;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getStoredToken);

  const login = (token) => {
    localStorage.setItem("token", token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  const getPayload = () => decodeToken(context.token);

  const getCurrentStaffId = () => {
    const payload = getPayload();
    return payload?.id ?? payload?.userid ?? payload?.staffid ?? null;
  };

  const isAdmin = () => {
    const payload = getPayload();
    return payload?.role === 99;
  };

  return { ...context, getCurrentStaffId, isAdmin };
};