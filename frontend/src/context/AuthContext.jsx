import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Check current session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const res = await API.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.user);
            setToken(storedToken);
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    if (res.data.success) {
      const { token: authToken, user: userData } = res.data;
      localStorage.setItem("token", authToken);
      setToken(authToken);
      setUser(userData);
    }
    return res.data;
  };

  // Register handler
  const register = async (name, email, password) => {
    const res = await API.post("/auth/register", { name, email, password });
    if (res.data.success) {
      const { token: authToken, user: userData } = res.data;
      localStorage.setItem("token", authToken);
      setToken(authToken);
      setUser(userData);
    }
    return res.data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Forgot Password request OTP
  const forgotPassword = async (email) => {
    const res = await API.post("/auth/forgot-password", { email });
    return res.data;
  };

  // Reset Password using OTP
  const resetPassword = async (email, otp, newPassword) => {
    const res = await API.post("/auth/reset-password", { email, otp, newPassword });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
