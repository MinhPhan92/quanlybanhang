import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

export interface Order {
  MaDonHang: number;
  NgayDat: string;
  TongTien: number;
  TrangThai: string;
  MaKH?: number;
  MaNV?: number;
  KhuyenMai?: string;
  PhiShip?: number;
  MaShipper?: number;
}

export interface StatusUpdateRequest {
  new_status: string;
  old_status?: string;
}

export interface StatusUpdateResponse {
  success: boolean;
  message: string;
  order_id: number;
  old_status: string;
  new_status: string;
  inventory_updated: boolean;
}

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    // apiClient base already includes /api
    return apiClient("/donhang");
  },

  getOne: async (id: number): Promise<Order> => {
    return apiClient(`/donhang/${id}`);
  },

  updateStatus: async (id: number, newStatus: string): Promise<StatusUpdateResponse> => {
    return apiClient(`/donhang/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ new_status: newStatus }),
    });
  },
};

