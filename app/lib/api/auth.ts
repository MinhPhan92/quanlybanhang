import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  user: {
    MaTK: number;
    username: string;
    role: string;
  };
}

export interface UserInfo {
  MaTK: number;
  username: string;
  role: string;
  MaNV?: number;
  MaKH?: number;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  getCurrentUser: (): UserInfo | null => {
    if (typeof window === "undefined") return null;
    
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        MaTK: payload.MaTK,
        username: payload.username,
        role: payload.role,
        MaNV: payload.MaNV,
        MaKH: payload.MaKH,
      };
    } catch {
      return null;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },

  isAdmin: (): boolean => {
    const user = authApi.getCurrentUser();
    return user?.role === "Admin";
  },
};

