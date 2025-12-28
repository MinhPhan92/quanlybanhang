export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },
  STATUS: "/status",
  PRODUCT: {
    BASE: "/sanpham",
    GET_ALL: "/sanpham",
    GET_ONE: (id: number) => `/sanpham/${id}`,
    CREATE: "/sanpham",
    UPDATE: (id: number) => `/sanpham/${id}`,
    DELETE: (id: number) => `/sanpham/${id}`,
  },
  CATEGORY: {
    BASE: "/danhmuc",
    GET_ALL: "/danhmuc",
  },
  ORDER: {
    BASE: "/donhang",
    GET_ALL: "/donhang",
    GET_ONE: (id: number) => `/donhang/${id}`,
    UPDATE_STATUS: (id: number) => `/donhang/${id}/status`,
  },
  LOGS: {
    SYSTEM: "/logs/systemlog",
    ACTIVITY: "/logs/activitylog",
  },
  PROJECT: {
    BASE: "/project",
    GET_ALL: "/project",
    GET_ONE: (id: number) => `/project/${id}`,
    CREATE: "/project",
    UPDATE: (id: number) => `/project/${id}`,
    DELETE: (id: number) => `/project/${id}`,
  },
  REPORT: {
    SUMMARY: "/baocao/summary",
    REVENUE: "/baocao/revenue",
    DOANHTHU: "/baocao/doanhthu",
    ORDERS: "/baocao/orders",
    BEST_SELLING: "/baocao/best_selling",
    LOW_INVENTORY: "/baocao/low_inventory",
  },
};

