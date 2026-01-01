import apiClient from "../utils/axios";

export interface Voucher {
  code: string;
  name: string;
  type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  valid_from: string;
  valid_to: string;
  usage_limit: number;
  used_count: number;
  remaining_uses: number;
  is_active: boolean;
}

export interface VoucherListResponse {
  vouchers: Voucher[];
  total: number;
}

export const promotionsApi = {
  getList: async (): Promise<VoucherListResponse> => {
    return apiClient("/promotions/list");
  },
};

