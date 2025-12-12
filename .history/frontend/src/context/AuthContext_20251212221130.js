// frontend/src/context/AuthContext.js
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, user: null });
  const [initializing, setInitializing] = useState(true);

  // Load auth from localStorage on app start
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem("auth");
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        setAuth(parsed);
      }
    } catch (err) {
      console.error("Failed to parse auth from localStorage", err);
      localStorage.removeItem("auth");
    } finally {
      setInitializing(false);
    }
  }, []);

  const login = (data) => {
    const rawUser = data.user || null;
    const normalizedUser = rawUser
      ? {
          ...rawUser,
          id: rawUser.id || rawUser._id || rawUser.userId,
        }
      : null;

    const newAuth = {
      token: data.token || null,
      user: normalizedUser,
    };

    setAuth(newAuth);
    localStorage.setItem("auth", JSON.stringify(newAuth));
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};
