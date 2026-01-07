// =====================================================
// 📋 ORDER PROCESSING FLOW - STEP 3: FRONTEND ORDER API
// =====================================================
// Frontend API wrapper for order operations.
// These functions call backend endpoints in backend/routes/donhang.py
// Flow:
// 1. create() - Creates new order from cart items (called from checkout)
// 2. getAll() / getMyOrders() - Retrieves orders for display
// 3. getOne() - Gets order details
// 4. updateStatus() - Updates order status (triggers inventory changes)
// =====================================================

import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

// Order interface - represents an order in the system
export interface Order {
  MaDonHang: number; // Order ID
  NgayDat: string; // Order date
  TongTien: number; // Total amount (after discount)
  TrangThai: string; // Order status (e.g., "Chờ thanh toán", "Đang xử lý")
  MaKH?: number; // Customer ID
  MaNV?: number; // Employee ID (who processed the order)
  KhuyenMai?: string; // Discount/promotion info
  PhiShip?: number; // Shipping fee
  MaShipper?: number; // Shipper ID (for delivery)
  items?: OrderItem[]; // Order items (products in the order)
}

export interface StatusUpdateRequest {
  new_status: string;
  old_status?: string;
}

export interface StatusUpdateResponse {
  success: boolean;
  message: string;
  order_id: number;
  old_status: string;
  new_status: string;
  inventory_updated: boolean;
}

export interface OrderItem {
  MaSP: number;
  TenSP: string;
  SoLuong: number;
  DonGia: number;
  GiamGia?: number;
  image?: string;
}

export interface OrderDetail extends Order {
  items?: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
}

export const ordersApi = {
  // ORDER FLOW STEP 3.1: Get all orders
  // Backend filters by role: customers see only their orders, employees/admins see all
  // Calls GET /api/donhang/ → backend/routes/donhang.py get_all_donhang()
  getAll: async (): Promise<Order[]> => {
    // apiClient base already includes /api
    // Backend route requires trailing slash when redirect_slashes=False
    return apiClient("/donhang/");
  },

  // ORDER FLOW STEP 3.2: Get current user's orders
  // Same as getAll() but semantically clearer for customer views
  // Backend endpoint /donhang/ already handles role-based filtering:
  // - Customers see only their orders
  // - Employees/Admins see all orders
  getMyOrders: async (): Promise<Order[]> => {
    return apiClient("/donhang/");
  },

  // ORDER FLOW STEP 3.3: Get single order details
  // Returns order with all items and details
  // Calls GET /api/donhang/{id} → backend/routes/donhang.py get_donhang()
  getOne: async (id: number): Promise<OrderDetail> => {
    return apiClient(`/donhang/${id}`);
  },

  // ORDER FLOW STEP 3.4: Create new order
  // This is called from checkout page after user submits form
  // Calls POST /api/donhang/ → backend/routes/donhang.py create_donhang()
  // Backend creates DonHang record and DonHang_SanPham records (order items)
  // Returns order ID and final total (after discount applied)
  create: async (orderData: {
    NgayDat: string; // Order date
    TongTien: number; // Original total (before discount)
    TrangThai: string; // Initial status (usually "Chờ thanh toán")
    MaKH?: number; // Customer ID
    MaNV?: number; // Employee ID (if order created by employee)
    discount_percentage?: number; // Discount percentage to apply
    items?: Array<{
      MaSP: number; // Product ID
      SoLuong: number; // Quantity
      DonGia: number; // Price snapshot at order time
      GiamGia?: number; // Item-level discount
    }>;
  }): Promise<{
    MaDonHang: number; // Created order ID
    TongTien: number; // Final total after discount
    voucher_applied?: boolean; // Legacy field
    discount_percentage?: number; // Applied discount percentage
    discount_amount?: number; // Discount amount in VND
  }> => {
    return apiClient("/donhang/", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  // ORDER FLOW STEP 3.5: Update order status
  // Called by admin/employee to change order status
  // Calls PUT /api/donhang/{id}/status → backend/routes/donhang.py update_order_status()
  // Backend handles inventory changes based on status transition
  // Status changes trigger inventory reserve/release/confirm/cancel operations
  updateStatus: async (
    id: number,
    newStatus: string
  ): Promise<StatusUpdateResponse> => {
    return apiClient(`/donhang/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ new_status: newStatus }),
    });
  },
};
