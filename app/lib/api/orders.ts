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

export interface OrderItem {
  MaSP: number;
  TenSP: string;
  SoLuong: number;
  DonGia: number;
  GiamGia?: number;
  image?: string;
}

export interface OrderDetail extends Order {
  items?: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
}

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    // apiClient base already includes /api
    // Backend route requires trailing slash when redirect_slashes=False
    return apiClient("/donhang/");
  },

  getOne: async (id: number): Promise<OrderDetail> => {
    return apiClient(`/donhang/${id}`);
  },

  create: async (orderData: {
    NgayDat: string;
    TongTien: number;
    TrangThai: string;
    MaKH?: number;
    MaNV?: number;
    voucher_code?: string;
  }): Promise<{ MaDonHang: number; TongTien: number; voucher_applied?: boolean }> => {
    return apiClient("/donhang/", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  updateStatus: async (id: number, newStatus: string): Promise<StatusUpdateResponse> => {
    return apiClient(`/donhang/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ new_status: newStatus }),
    });
  },
};

