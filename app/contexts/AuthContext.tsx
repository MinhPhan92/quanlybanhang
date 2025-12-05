"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, UserInfo } from "@/app/lib/api/auth";

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from token on mount
    refreshUser().catch((error) => {
      console.error("Error refreshing user:", error);
    });
  }, []);

  const refreshUser = async () => {
    // Try to get user from token first
    const userInfo = authApi.getCurrentUser();
    
    // If token exists, validate it with status API
    if (userInfo && authApi.isAuthenticated()) {
      try {
        const statusResponse = await authApi.checkStatus();
        // Update user with validated info from backend
        const validatedUser: UserInfo = {
          MaTK: statusResponse.user.MaTK,
          username: statusResponse.user.username,
          role: statusResponse.user.role,
          MaNV: statusResponse.user.MaNV,
          MaKH: statusResponse.user.MaKH,
        };
        setUser(validatedUser);
      } catch (error) {
        // Token is invalid, clear it
        console.error("Token validation failed:", error);
        authApi.logout();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  };

  const login = (token: string, userInfo: UserInfo) => {
    localStorage.setItem("token", token);
    setUser(userInfo);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

