import apiClient from "../utils/axios";

export interface Payment {
  MaThanhToan: number;
  MaDonHang: number;
  PhuongThuc: string;
  NgayThanhToan: string;
  SoTien: number;
}

export const paymentsApi = {
  getOrderPayments: async (orderId: number): Promise<Payment[]> => {
    return apiClient(`/thanhtoan/history/${orderId}`);
  },
};

