import apiClient from "../utils/axios";

export interface Customer {
  MaKH: number;
  TenKH: string;
  SdtKH: string;
  EmailKH: string;
  DiaChiKH: string;
  IsDelete?: boolean;
}

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    return apiClient("/khachhang/");
  },

  getOne: async (id: number): Promise<Customer> => {
    return apiClient(`/khachhang/${id}`);
  },

  create: async (data: Omit<Customer, "MaKH">): Promise<{ MaKH: number }> => {
    return apiClient("/khachhang/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
    return apiClient(`/khachhang/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return apiClient(`/khachhang/${id}`, {
      method: "DELETE",
    });
  },
};

