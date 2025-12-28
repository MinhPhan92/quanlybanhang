import apiClient from "../utils/axios";

export interface ContactFormData {
  HoTen: string;
  Email: string;
  SoDienThoai?: string;
  ChuDe: string;
  NoiDung: string;
}

export interface ContactResponse {
  MaLienHe: number;
  HoTen: string;
  Email: string;
  SoDienThoai?: string;
  ChuDe: string;
  NoiDung: string;
  TrangThai: string;
  NgayGui: string;
  GhiChu?: string;
}

export const contactApi = {
  submit: async (data: ContactFormData): Promise<ContactResponse> => {
    return apiClient("/lienhe/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false, // Public endpoint, no auth required
      debug: true,
    });
  },
};

