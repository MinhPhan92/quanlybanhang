import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

export interface Product {
  MaSP: number;
  TenSP: string;
  GiaSP: number;
  SoLuongTonKho: number;
  MoTa?: string;
  MaDanhMuc?: number;
  IsDelete: boolean;
  attributes?: Record<string, any>;
  TenDanhMuc?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

export interface ProductCreateRequest {
  TenSP: string;
  GiaSP: number;
  SoLuongTonKho: number;
  MoTa?: string;
  MaDanhMuc?: number;
  attributes?: Record<string, any>;
}

export interface ProductUpdateRequest {
  TenSP?: string;
  GiaSP?: number;
  SoLuongTonKho?: number;
  MoTa?: string;
  MaDanhMuc?: number;
  attributes?: Record<string, any>;
}

export interface Category {
  MaDanhMuc: number;
  TenDanhMuc: string;
  IsDelete: boolean;
}

export const productsApi = {
  getAll: async (page: number = 1, limit: number = 10, includeAttributes: boolean = true): Promise<ProductListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      include_attributes: includeAttributes.toString(),
    });
    // apiClient base already includes /api, so use route path without duplicating /api
    return apiClient(`/sanpham?${params.toString()}`, { auth: false, debug: true });
  },

  getOne: async (id: number): Promise<Product> => {
    return apiClient(`/sanpham/${id}`, { auth: false, debug: true });
  },

  create: async (data: ProductCreateRequest): Promise<Product> => {
    return apiClient("/sanpham", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: ProductUpdateRequest): Promise<Product> => {
    return apiClient(`/sanpham/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return apiClient(`/sanpham/${id}`, {
      method: "DELETE",
    });
  },
};

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    // apiClient base already includes /api
    return apiClient("/danhmuc", { auth: false, debug: true });
  },
};

