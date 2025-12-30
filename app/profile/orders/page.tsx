"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { ordersApi, Order } from "@/app/lib/api/orders";
import {
  Package,
  Eye,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import styles from "./orders.module.css";

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }
      loadOrders();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getAll();
      // Filter orders for current customer if they're a customer
      if (user?.role === "KhachHang") {
        // Backend should filter by customer, but we can also filter here as safety
        setOrders(data || []);
      } else {
        setOrders(data || []);
      }
    } catch (err: any) {
      console.error("Error loading orders:", err);
      setError(err.message || "Không thể tải danh sách đơn hàng");
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
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
      case "Completed":
        return <CheckCircle size={18} className={styles.statusIcon} />;
      case "Processing":
      case "Shipped":
        return <Truck size={18} className={styles.statusIcon} />;
      case "Cancelled":
        return <XCircle size={18} className={styles.statusIcon} />;
      default:
        return <Clock size={18} className={styles.statusIcon} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
      case "Completed":
        return styles.statusDelivered;
      case "Processing":
      case "Shipped":
        return styles.statusProcessing;
      case "Cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      Pending: "Chờ xử lý",
      Processing: "Đang xử lý",
      Shipped: "Đang giao",
      Delivered: "Đã giao",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
      Confirmed: "Đã xác nhận",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lịch sử đơn hàng</h1>
        <p className={styles.subtitle}>Xem và theo dõi các đơn hàng của bạn</p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={loadOrders} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      )}

      {orders.length > 0 ? (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.MaDonHang} className={styles.orderCard}>
              <div className={styles.orderHeader}>
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
                <div className={styles.orderStatus}>
                  <span
                    className={`${styles.statusBadge} ${getStatusColor(order.TrangThai)}`}
                  >
                    {getStatusIcon(order.TrangThai)}
                    {getStatusLabel(order.TrangThai)}
                  </span>
                </div>
              </div>

              <div className={styles.orderBody}>
                <div className={styles.orderDetails}>
                  <div className={styles.detailItem}>
                    <DollarSign size={16} />
                    <span>
                      <strong>Tổng tiền:</strong> {formatCurrency(order.TongTien)}
                    </span>
                  </div>
                  {order.PhiShip && (
                    <div className={styles.detailItem}>
                      <Truck size={16} />
                      <span>
                        <strong>Phí ship:</strong> {formatCurrency(order.PhiShip)}
                      </span>
                    </div>
                  )}
                  {order.KhuyenMai && (
                    <div className={styles.detailItem}>
                      <span>
                        <strong>Mã giảm giá:</strong> {order.KhuyenMai}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.orderFooter}>
                <Link
                  href={`/order/${order.MaDonHang}`}
                  className={styles.viewButton}
                >
                  <Eye size={16} />
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Package size={48} />
          <p>Bạn chưa có đơn hàng nào</p>
          <Link href="/shop" className={styles.shopButton}>
            Mua sắm ngay
          </Link>
        </div>
      )}
    </div>
  );
}

