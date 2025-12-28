import apiClient from "../utils/axios";

export interface AddToCartRequest {
  sanPhamId: number;
  soLuong: number;
}

export interface CartItemResponse {
  sanPhamId: number;
  tenSP: string;
  giaSP: number;
  soLuong: number;
  thanhTien: number;
}

export interface AddToCartResponse {
  message: string;
  cartItem: CartItemResponse;
}

export const cartApi = {
  addToCart: async (data: AddToCartRequest): Promise<AddToCartResponse> => {
    return apiClient("/giohang/add", {
      method: "POST",
      body: JSON.stringify(data),
      auth: true, // Requires authentication
    });
  },

  getCart: async (): Promise<{ message: string; items: CartItemResponse[] }> => {
    return apiClient("/giohang", {
      method: "GET",
      auth: true,
    });
  },

  removeFromCart: async (sanPhamId: number): Promise<{ message: string }> => {
    return apiClient(`/giohang/${sanPhamId}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

