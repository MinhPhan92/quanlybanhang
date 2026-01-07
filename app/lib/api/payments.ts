import apiClient from "../utils/axios";

export interface Payment {
  MaThanhToan: number;
  MaDonHang: number;
  PhuongThuc: string;
  NgayThanhToan: string;
  SoTien: number;
}

// =====================================================
// 📋 ORDER PROCESSING FLOW - STEP 5: PAYMENT API
// =====================================================
// Frontend API wrapper for payment transaction operations.
// These functions handle QR payment gateway integration.
// Flow:
// 1. createTransaction() - Creates payment transaction for order
// 2. getTransaction() - Gets transaction info (for mock payment page)
// 3. submitCallback() - Submits payment result (success/failed/canceled)
// 4. getOrderTransactions() - Gets all transactions for an order
// =====================================================

// =====================================================
// 📋 Mock Payment Transaction Types (QR Payment Gateway)
// =====================================================

export interface CreateTransactionRequest {
  orderId: number;
}

export interface CreateTransactionResponse {
  transactionId: string;
  orderId: number;
  amount: number;
  paymentUrl: string;
  status: string;
}

export interface TransactionInfo {
  transactionId: string;
  orderId: number;
  amount: number;
  status: string;
  createdAt: string;
  signature: string | null;
}

export interface PaymentCallbackRequest {
  transactionId: string;
  result: "SUCCESS" | "FAILED" | "CANCELED";
  signature: string;
}

export interface PaymentCallbackResponse {
  success: boolean;
  message: string;
  transactionId: string;
  orderId: number;
  orderStatus: string;
  redirectUrl: string;
}

export interface OrderTransaction {
  transactionId: string;
  orderId: number;
  amount: number;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export const paymentsApi = {
  // =====================================================
  // Legacy payment history
  // =====================================================
  getOrderPayments: async (orderId: number): Promise<Payment[]> => {
    return apiClient(`/thanhtoan/history/${orderId}`);
  },

  // =====================================================
  // Mock QR Payment Gateway APIs
  // =====================================================

  /**
   * ORDER FLOW STEP 5.1: Create payment transaction for order
   * Called from checkout page when user selects QR payment method.
   * Creates PaymentTransaction record in database.
   * Returns paymentUrl that can be used to generate QR code.
   * Calls POST /api/payment/create-transaction → backend/routes/mock_payment.py create_transaction()
   */
  createTransaction: async (
    orderId: number
  ): Promise<CreateTransactionResponse> => {
    return apiClient("/payment/create-transaction", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
  },

  /**
   * Get transaction info by ID.
   * Used by mock payment page to display transaction details.
   * Does not require authentication (simulates external payment gateway).
   */
  getTransaction: async (transactionId: string): Promise<TransactionInfo> => {
    return apiClient(`/payment/transaction/${transactionId}`, {
      auth: false, // No auth required - simulates external gateway
    });
  },

  /**
   * ORDER FLOW STEP 5.2: Submit payment callback with result
   * Called when user clicks Success/Failed/Cancel on mock payment page.
   * Backend updates transaction status and order status based on result.
   * If SUCCESS: Updates order status to "Chờ xử lý" and creates ThanhToan record.
   * Calls POST /api/payment/callback → backend/routes/mock_payment.py payment_callback()
   */
  submitCallback: async (
    transactionId: string,
    result: "SUCCESS" | "FAILED" | "CANCELED",
    signature: string
  ): Promise<PaymentCallbackResponse> => {
    return apiClient("/payment/callback", {
      method: "POST",
      auth: false, // No auth required - simulates external gateway callback
      body: JSON.stringify({
        transactionId,
        result,
        signature,
      }),
    });
  },

  /**
   * Get all transactions for an order.
   */
  getOrderTransactions: async (
    orderId: number
  ): Promise<OrderTransaction[]> => {
    return apiClient(`/payment/order/${orderId}/transactions`);
  },
};
