import apiClient from "../utils/axios";

export interface Employee {
  MaNV: number;
  TenNV: string;
  ChucVu: string;
  SdtNV: string;
}

export interface EmployeeCreateRequest {
  TenNV: string;
  ChucVu: string;
  SdtNV: string;
  password: string;
}

export const employeesApi = {
  getAll: async (): Promise<Employee[]> => {
    return apiClient("/nhanvien/");
  },

  getOne: async (id: number): Promise<Employee> => {
    return apiClient(`/nhanvien/${id}`);
  },

  create: async (data: EmployeeCreateRequest): Promise<{ MaNV: number }> => {
    return apiClient("/nhanvien/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<EmployeeCreateRequest>): Promise<Employee> => {
    return apiClient(`/nhanvien/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return apiClient(`/nhanvien/${id}`, {
      method: "DELETE",
    });
  },
};

