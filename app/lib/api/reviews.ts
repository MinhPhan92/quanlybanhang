import apiClient from "../utils/axios";

export interface Review {
  MaDanhGia: number;
  MaSP: number;
  MaKH: number;
  DiemDanhGia: number;
  NoiDung?: string;
  NgayDanhGia: string;
  TenKH?: string;
  TenSP?: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  average_rating?: number;
}

export interface ReviewCreateRequest {
  MaSP: number;
  DiemDanhGia: number;
  NoiDung?: string;
}

export const reviewsApi = {
  getAll: async (
    page: number = 1,
    limit: number = 50
  ): Promise<ReviewListResponse> => {
    return apiClient(`/reviews/?page=${page}&limit=${limit}`);
  },

  getProductReviews: async (
    productId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<ReviewListResponse> => {
    return apiClient(`/reviews/products/${productId}?page=${page}&limit=${limit}`);
  },

  getMyReviews: async (): Promise<Review[]> => {
    return apiClient("/reviews/my-reviews");
  },

  createReview: async (data: ReviewCreateRequest): Promise<Review> => {
    return apiClient("/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteReview: async (reviewId: number): Promise<{ message: string }> => {
    return apiClient(`/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },
};

