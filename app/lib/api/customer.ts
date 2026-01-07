import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

export interface CustomerInfo {
  MaKH: number;
  TenKH: string;
  SdtKH: string;
  EmailKH: string;
  DiaChiKH: string;
  IsDelete: boolean;
}

export interface CustomerUpdateRequest {
  TenKH?: string;
  SdtKH?: string;
  EmailKH?: string;
  DiaChiKH?: string;
}

export const customerApi = {
  getMyInfo: async (): Promise<CustomerInfo> => {
    return apiClient("/khachhang/me", {
      method: "GET",
      auth: true,
    });
  },

  updateMyInfo: async (data: CustomerUpdateRequest): Promise<CustomerInfo> => {
    return apiClient("/khachhang/me", {
      method: "PUT",
      body: JSON.stringify(data),
      auth: true,
    });
  },
};

