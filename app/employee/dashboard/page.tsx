"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { ordersApi, Order } from "@/app/lib/api/orders";
import { productsApi } from "@/app/lib/api/products";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
} from "lucide-react";
import styles from "./dashboard.module.css";

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    totalProducts: 0,
    todayOrders: 0,
    processingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!isLoading) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token || !isAuthenticated) {
        router.push("/login");
        return;
      }
      
      // Only Employee and NhanVien can access
      if (user && !["Employee", "NhanVien"].includes(user.role || "")) {
        router.push("/");
        return;
      }
      
      loadDashboardData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load orders
      const orders = await ordersApi.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pendingOrders = orders.filter(o => o.TrangThai === "Pending").length;
      const processingOrders = orders.filter(o => o.TrangThai === "Processing").length;
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.NgayDat);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).length;
      
      // Load products
      const productsResponse = await productsApi.getAll(1, 1, false);
      
      // Get recent orders (last 5)
      const sortedOrders = orders
        .sort((a, b) => new Date(b.NgayDat).getTime() - new Date(a.NgayDat).getTime())
        .slice(0, 5);
      
      setStats({
        pendingOrders,
        totalProducts: productsResponse.total,
        todayOrders,
        processingOrders,
      });
      setRecentOrders(sortedOrders);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      Pending: "Chờ xử lý",
      Confirmed: "Đã xác nhận",
      Processing: "Đang xử lý",
      Shipped: "Đã giao hàng",
      Delivered: "Đã giao",
      Cancelled: "Đã hủy",
      Returned: "Đã trả hàng",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Nhân viên</h1>
          <p className={styles.subtitle}>Chào mừng, {user?.username}!</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{stats.pendingOrders}</h3>
            <p className={styles.statLabel}>Đơn chờ xử lý</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#dbeafe", color: "#2563eb" }}>
            <ShoppingCart size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{stats.todayOrders}</h3>
            <p className={styles.statLabel}>Đơn hôm nay</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#e0e7ff", color: "#6366f1" }}>
            <Package size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{stats.processingOrders}</h3>
            <p className={styles.statLabel}>Đơn đang xử lý</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#d1fae5", color: "#059669" }}>
            <Package size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{stats.totalProducts}</h3>
            <p className={styles.statLabel}>Tổng sản phẩm</p>
          </div>
        </div>
      </div>

      <div className={styles.recentOrders}>
        <h2 className={styles.sectionTitle}>Đơn hàng gần đây</h2>
        {recentOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className={styles.ordersTable}>
            <table>
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.MaDonHang}>
                    <td>#{order.MaDonHang}</td>
                    <td>{formatDate(order.NgayDat)}</td>
                    <td>{formatPrice(order.TongTien)}</td>
                    <td>
                      <span className={styles.statusBadge}>
                        {getStatusLabel(order.TrangThai)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

