"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { paymentsApi, TransactionInfo } from "@/app/lib/api/payments";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  CreditCard,
  Shield,
  Lock,
} from "lucide-react";
import styles from "./mock-pay.module.css";

// =====================================================
// 📋 Mock Payment Gateway Page
// =====================================================
// This page simulates a real payment gateway (VNPay/MoMo style).
// It shows transaction details and allows the user to:
// - Confirm successful payment
// - Mark payment as failed
// - Cancel the transaction
//
// This is for TESTING/DEMO purposes only.

interface MockPayPageProps {
  params: Promise<{ transactionId: string }>;
}

export default function MockPayPage({ params }: MockPayPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const transactionId = resolvedParams.transactionId;

  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentsApi.getTransaction(transactionId);
      setTransaction(data);
    } catch (err: any) {
      console.error("Error loading transaction:", err);
      setError(err.message || "Không thể tải thông tin giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (
    result: "SUCCESS" | "FAILED" | "CANCELED"
  ) => {
    if (!transaction) return;

    setProcessing(true);
    setProcessingAction(result);

    try {
      // Use the signature from the transaction (backend generated)
      const signature = transaction.signature || "";

      const response = await paymentsApi.submitCallback(
        transactionId,
        result,
        signature
      );

      // Redirect to the result page
      if (response.redirectUrl) {
        router.push(response.redirectUrl);
      } else {
        // Fallback redirect
        if (result === "SUCCESS") {
          router.push(
            `/payment/success?transactionId=${transactionId}&orderId=${transaction.orderId}&amount=${transaction.amount}`
          );
        } else {
          router.push(
            `/payment/failed?error=${encodeURIComponent(response.message)}`
          );
        }
      }
    } catch (err: any) {
      console.error("Payment callback error:", err);
      setError(err.message || "Có lỗi xảy ra khi xử lý thanh toán");
      setProcessing(false);
      setProcessingAction(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Đang tải thông tin giao dịch...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !transaction) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <XCircle size={64} className={styles.errorIcon} />
            <h1>Lỗi Giao Dịch</h1>
            <p>{error || "Không tìm thấy giao dịch"}</p>
            <button
              onClick={() => router.push("/")}
              className={styles.homeButton}
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already processed state
  if (transaction.status !== "CREATED") {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.processedState}>
            {transaction.status === "SUCCESS" ? (
              <CheckCircle size={64} className={styles.successIcon} />
            ) : (
              <XCircle size={64} className={styles.errorIcon} />
            )}
            <h1>Giao Dịch Đã Xử Lý</h1>
            <p>
              Giao dịch này đã được xử lý với trạng thái:
              <strong className={styles[`status${transaction.status}`]}>
                {" "}
                {transaction.status}
              </strong>
            </p>
            <button
              onClick={() => router.push("/orders")}
              className={styles.viewOrdersButton}
            >
              Xem Đơn Hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <CreditCard size={40} />
            <div>
              <h1>Gia Dụng Plus Pay</h1>
              <span>Cổng Thanh Toán Trực Tuyến</span>
            </div>
          </div>
          <div className={styles.securityBadge}>
            <Lock size={16} />
            <span>Secure Payment</span>
          </div>
        </div>

        {/* Transaction Card */}
        <div className={styles.transactionCard}>
          <div className={styles.cardHeader}>
            <Shield size={24} />
            <h2>Xác Nhận Thanh Toán</h2>
          </div>

          {/* Transaction Details */}
          <div className={styles.transactionDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Mã giao dịch:</span>
              <span className={styles.detailValue}>
                {transaction.transactionId}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Mã đơn hàng:</span>
              <span className={styles.detailValue}>#{transaction.orderId}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Ngày tạo:</span>
              <span className={styles.detailValue}>
                {new Date(transaction.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className={styles.amountRow}>
              <span className={styles.amountLabel}>Số tiền thanh toán:</span>
              <span className={styles.amountValue}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={() => handlePaymentAction("SUCCESS")}
              disabled={processing}
              className={styles.successButton}
            >
              {processing && processingAction === "SUCCESS" ? (
                <Loader2 className={styles.btnSpinner} size={20} />
              ) : (
                <CheckCircle size={20} />
              )}
              Thanh Toán Thành Công
            </button>

            <button
              onClick={() => handlePaymentAction("FAILED")}
              disabled={processing}
              className={styles.failButton}
            >
              {processing && processingAction === "FAILED" ? (
                <Loader2 className={styles.btnSpinner} size={20} />
              ) : (
                <XCircle size={20} />
              )}
              Thanh Toán Thất Bại
            </button>

            <button
              onClick={() => handlePaymentAction("CANCELED")}
              disabled={processing}
              className={styles.cancelButton}
            >
              {processing && processingAction === "CANCELED" ? (
                <Loader2 className={styles.btnSpinner} size={20} />
              ) : (
                <Ban size={20} />
              )}
              Hủy Giao Dịch
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            Powered by <strong>Gia Dụng Plus Payment</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
