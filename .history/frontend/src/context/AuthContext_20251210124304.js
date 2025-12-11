// frontend/src/context/AuthContext.js
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, user: null });

  // Load auth from localStorage on app start
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) setAuth(JSON.parse(storedAuth));
  }, []);

  const login = (data) => {
    setAuth({ token: data.token, user: data.user });
    localStorage.setItem("auth", JSON.stringify(data));
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
