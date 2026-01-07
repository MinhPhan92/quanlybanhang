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

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
}

export interface RegisterResponse {
  MaTK: number;
  username: string;
  role: string;
}

export interface UserInfo {
  MaTK: number;
  username: string;
  role: string;
  MaNV?: number;
  MaKH?: number;
}

export interface StatusResponse {
  status: string;
  version: string;
  user: {
    MaTK: number;
    username: string;
    role: string;
    MaNV?: number;
    MaKH?: number;
    exp?: number;
    iat?: number;
  };
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
      auth: false, // Registration doesn't require authentication
    });
  },

  checkStatus: async (): Promise<StatusResponse> => {
    return apiClient(API_ENDPOINTS.STATUS, {
      method: "GET",
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
      localStorage.removeItem("user_role");
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

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    return apiClient("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
      auth: true,
    });
  },

  forgotPassword: async (email: string): Promise<{ status: string; message: string; token?: string }> => {
    return apiClient(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ status: string; message: string }> => {
    return apiClient(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
      auth: false,
    });
  },
};

