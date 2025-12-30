"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { ordersApi, Order } from "@/app/lib/api/orders";
import { paymentsApi, Payment } from "@/app/lib/api/payments";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Package,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import styles from "./payments.module.css";

export default function PaymentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<{ [orderId: number]: Payment[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }
      loadData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load orders
      const ordersData = await ordersApi.getAll();
      setOrders(ordersData || []);

      // Load payments for each order
      const paymentsMap: { [orderId: number]: Payment[] } = {};
      for (const order of ordersData || []) {
        try {
          const orderPayments = await paymentsApi.getOrderPayments(order.MaDonHang);
          if (orderPayments && orderPayments.length > 0) {
            paymentsMap[order.MaDonHang] = orderPayments;
          }
        } catch (err) {
          // Some orders may not have payments yet
          console.log(`No payments for order ${order.MaDonHang}`);
        }
      }
      setPayments(paymentsMap);
    } catch (err: any) {
      console.error("Error loading payments:", err);
      setError(err.message || "Không thể tải lịch sử thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: { [key: string]: string } = {
      Cash: "Tiền mặt",
      Card: "Thẻ",
      BankTransfer: "Chuyển khoản",
      EWallet: "Ví điện tử",
    };
    return methodMap[method] || method;
  };

  const ordersWithPayments = orders.filter(
    (order) => payments[order.MaDonHang] && payments[order.MaDonHang].length > 0
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải lịch sử thanh toán...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lịch sử thanh toán</h1>
        <p className={styles.subtitle}>Xem lịch sử thanh toán của các đơn hàng</p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      )}

      {ordersWithPayments.length > 0 ? (
        <div className={styles.paymentsList}>
          {ordersWithPayments.map((order) => {
            const orderPayments = payments[order.MaDonHang] || [];
            const totalPaid = orderPayments.reduce(
              (sum, p) => sum + (p.SoTien || 0),
              0
            );

            return (
              <div key={order.MaDonHang} className={styles.paymentCard}>
                <div className={styles.paymentHeader}>
                  <div className={styles.orderInfo}>
                    <Package size={20} />
                    <div>
                      <h3 className={styles.orderId}>
                        Đơn hàng #{order.MaDonHang.toString().padStart(4, "0")}
                      </h3>
                      <p className={styles.orderDate}>
                        <Calendar size={14} />
                        {formatDate(order.NgayDat)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.orderTotal}>
                    <span className={styles.totalLabel}>Tổng đơn:</span>
                    <span className={styles.totalAmount}>
                      {formatCurrency(order.TongTien)}
                    </span>
                  </div>
                </div>

                <div className={styles.paymentsSection}>
                  <h4 className={styles.paymentsTitle}>Chi tiết thanh toán</h4>
                  <div className={styles.paymentsList}>
                    {orderPayments.map((payment) => (
                      <div key={payment.MaThanhToan} className={styles.paymentItem}>
                        <div className={styles.paymentInfo}>
                          <CreditCard size={18} />
                          <div>
                            <p className={styles.paymentMethod}>
                              {getPaymentMethodLabel(payment.PhuongThuc)}
                            </p>
                            <p className={styles.paymentDate}>
                              {formatDate(payment.NgayThanhToan)}
                            </p>
                          </div>
                        </div>
                        <div className={styles.paymentAmount}>
                          <DollarSign size={18} />
                          {formatCurrency(payment.SoTien)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.paymentSummary}>
                    <span className={styles.summaryLabel}>Đã thanh toán:</span>
                    <span className={styles.summaryAmount}>
                      {formatCurrency(totalPaid)}
                    </span>
                    {totalPaid < order.TongTien && (
                      <span className={styles.remainingAmount}>
                        Còn lại: {formatCurrency(order.TongTien - totalPaid)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.paymentFooter}>
                  <Link
                    href={`/order/${order.MaDonHang}`}
                    className={styles.viewOrderButton}
                  >
                    <ExternalLink size={16} />
                    Xem đơn hàng
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <CreditCard size={48} />
          <p>Bạn chưa có giao dịch thanh toán nào</p>
          <Link href="/orders" className={styles.ordersButton}>
            Xem đơn hàng
          </Link>
        </div>
      )}
    </div>
  );
}

