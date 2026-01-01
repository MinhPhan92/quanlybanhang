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

export interface ProductFilters {
  madanhmuc?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
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
  getAll: async (
    page: number = 1,
    limit: number = 10,
    includeAttributes: boolean = true,
    filters: ProductFilters = {}
  ): Promise<ProductListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      include_attributes: includeAttributes.toString(),
    });

    // Thêm bộ lọc nếu có (đặt đúng tên param theo backend)
    if (typeof filters.madanhmuc === "number") {
      params.set("madanhmuc", filters.madanhmuc.toString());
    }
    if (typeof filters.min_price === "number") {
      params.set("min_price", filters.min_price.toString());
    }
    if (typeof filters.max_price === "number") {
      params.set("max_price", filters.max_price.toString());
    }
    if (typeof filters.search === "string" && filters.search.trim() !== "") {
      params.set("search", filters.search.trim());
    }

    // apiClient base already includes /api, so use route path without duplicating /api
    // Backend route is @router.get("/") which requires trailing slash when redirect_slashes=False
    return apiClient(`/sanpham/?${params.toString()}`, { auth: false, debug: true });
  },

  getOne: async (id: number): Promise<Product> => {
    return apiClient(`/sanpham/${id}`, { auth: false, debug: true });
  },

  create: async (data: ProductCreateRequest): Promise<Product> => {
    return apiClient("/sanpham/", {
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
    // Backend route requires trailing slash when redirect_slashes=False
    return apiClient("/danhmuc/", { auth: false, debug: true });
  },

  create: async (data: { TenDanhMuc: string }): Promise<{ MaDanhMuc: number }> => {
    return apiClient("/danhmuc/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: { TenDanhMuc: string }): Promise<Category> => {
    return apiClient(`/danhmuc/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return apiClient(`/danhmuc/${id}`, {
      method: "DELETE",
    });
  },
};

