export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
  },
  PROJECT: {
    BASE: "/api/project",
    GET_ALL: "/api/project",
    GET_ONE: (id: number) => `/api/project/${id}`,
    CREATE: "/api/project",
    UPDATE: (id: number) => `/api/project/${id}`,
    DELETE: (id: number) => `/api/project/${id}`,
  },
};

