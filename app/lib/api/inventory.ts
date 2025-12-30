import apiClient from "../utils/axios";

export interface LowStockProduct {
  MaSP: number;
  TenSP: string;
  SoLuongTonKho: number;
  Threshold?: number;
}

export interface LowStockResponse {
  products: LowStockProduct[];
  total: number;
  threshold: number;
}

export interface StockUpdateRequest {
  product_id: number;
  quantity_change: number;
  operation: "add" | "subtract";
}

export interface StockUpdateResponse {
  success: boolean;
  message: string;
  product_id: number;
  new_quantity?: number;
}

export const inventoryApi = {
  getLowStock: async (threshold: number = 10): Promise<LowStockResponse> => {
    return apiClient(`/inventory/low-stock?threshold=${threshold}`);
  },

  updateStock: async (data: StockUpdateRequest): Promise<StockUpdateResponse> => {
    return apiClient("/inventory/update-stock", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getAlerts: async (): Promise<LowStockProduct[]> => {
    return apiClient("/alerts/low-stock");
  },
};

