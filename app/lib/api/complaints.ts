import apiClient from "../utils/axios";

export interface Complaint {
  MaKhieuNai: number;
  MaKH: number;
  TieuDe: string;
  NoiDung: string;
  TrangThai: "Pending" | "Processing" | "Resolved" | "Closed";
  NgayTao: string;
  NgayCapNhat: string;
  PhanHoi?: string;
  MaNVPhanHoi?: number;
  TenKH?: string;
  TenNVPhanHoi?: string;
}

export interface ComplaintListResponse {
  complaints: Complaint[];
  total: number;
}

export interface ComplaintCreateRequest {
  TieuDe: string;
  NoiDung: string;
}

export interface ComplaintUpdateRequest {
  TrangThai?: "Pending" | "Processing" | "Resolved" | "Closed";
  PhanHoi?: string;
}

export const complaintsApi = {
  getAll: async (
    statusFilter?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ComplaintListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (statusFilter) {
      params.set("status_filter", statusFilter);
    }
    return apiClient(`/complaints?${params.toString()}`);
  },

  getMyComplaints: async (): Promise<Complaint[]> => {
    return apiClient("/complaints/my-complaints");
  },

  getOne: async (complaintId: number): Promise<Complaint> => {
    return apiClient(`/complaints/${complaintId}`);
  },

  create: async (data: ComplaintCreateRequest): Promise<Complaint> => {
    return apiClient("/complaints/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    complaintId: number,
    data: ComplaintUpdateRequest
  ): Promise<Complaint> => {
    return apiClient(`/complaints/${complaintId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (complaintId: number): Promise<{ message: string }> => {
    return apiClient(`/complaints/${complaintId}`, {
      method: "DELETE",
    });
  },
};

