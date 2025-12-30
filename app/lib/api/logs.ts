import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

export interface SystemLog {
  Id: number;
  Level: string;
  Endpoint: string;
  Method: string;
  StatusCode: number;
  RequestBody?: string;
  ResponseBody?: string;
  ErrorMessage?: string;
  CreatedAt: string;
}

export interface ActivityLog {
  Id: number;
  UserId?: number;
  Username?: string;
  Role?: string;
  Action: string;
  Entity?: string;
  EntityId?: string;
  Details?: string;
  IP?: string;
  UserAgent?: string;
  CreatedAt: string;
}

export interface LogListResponse<T> {
  logs: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface LogFilters {
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  // System log filters
  level?: string;
  endpoint?: string;
  // Activity log filters
  username?: string;
  role?: string;
  action?: string;
  entity?: string;
}

export const logsApi = {
  getSystemLogs: async (filters: LogFilters = {}): Promise<LogListResponse<SystemLog>> => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.level) params.append("level", filters.level);
    if (filters.endpoint) params.append("endpoint", filters.endpoint);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    // apiClient base already includes /api
    return apiClient(`/logs/systemlog${queryString ? `?${queryString}` : ""}`);
  },

  getActivityLogs: async (filters: LogFilters = {}): Promise<LogListResponse<ActivityLog>> => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.username) params.append("username", filters.username);
    if (filters.role) params.append("role", filters.role);
    if (filters.action) params.append("action", filters.action);
    if (filters.entity) params.append("entity", filters.entity);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    return apiClient(`/logs/activitylog${queryString ? `?${queryString}` : ""}`);
  },
};

