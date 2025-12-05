import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

export interface DashboardSummary {
  orders_today: number;
  total_products: number;
  total_customers: number;
  recent_orders: Array<{
    id: number;
    code: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string | null;
  }>;
  monthly_sales: Array<{
    name: string;
    sales: number;
  }>;
  new_products: Array<{
    id: number;
    name: string;
    price: string;
    image: string;
  }>;
}

export const reportsApi = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return apiClient(API_ENDPOINTS.REPORT.SUMMARY);
  },

  getRevenue: async (startDate: string, endDate: string): Promise<{ total_revenue: number }> => {
    return apiClient(`${API_ENDPOINTS.REPORT.REVENUE}?start_date=${startDate}&end_date=${endDate}`);
  },

  getOrders: async (startDate: string, endDate: string): Promise<{ total_orders: number }> => {
    return apiClient(`${API_ENDPOINTS.REPORT.ORDERS}?start_date=${startDate}&end_date=${endDate}`);
  },

  getBestSelling: async (top: number = 5): Promise<Array<{ TenSP: string; SoLuongBan: number }>> => {
    return apiClient(`${API_ENDPOINTS.REPORT.BEST_SELLING}?top=${top}`);
  },

  getLowInventory: async (threshold: number = 10): Promise<Array<{ MaSP: number; TenSP: string; SoLuongTonKho: number }>> => {
    return apiClient(`${API_ENDPOINTS.REPORT.LOW_INVENTORY}?threshold=${threshold}`);
  },
};

