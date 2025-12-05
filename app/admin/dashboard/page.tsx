"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { reportsApi, DashboardSummary } from "@/app/lib/api/reports";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!isLoading) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token || !isAuthenticated) {
        router.push("/login");
        return;
      }
      
      // Only Admin and Manager can access dashboard
      if (user && !["Admin", "Manager"].includes(user.role || "")) {
        router.push("/");
        return;
      }
      
      loadDashboardData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Không thể tải dữ liệu dashboard");
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={loadDashboardData} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={styles.container}>
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Chào mừng trở lại, {user?.username}!
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#3b82f6" }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Đơn hàng hôm nay</h3>
            <p className={styles.statValue}>{summary.orders_today}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#f59e0b" }}>
            <Package size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Tổng sản phẩm</h3>
            <p className={styles.statValue}>{summary.total_products}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#8b5cf6" }}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Tổng khách hàng</h3>
            <p className={styles.statValue}>{summary.total_customers}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#10b981" }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statLabel}>Doanh thu tháng này</h3>
            <p className={styles.statValue}>
              {formatCurrency(summary.monthly_sales[summary.monthly_sales.length - 1]?.sales || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Đơn hàng gần đây</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent_orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                summary.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.code}</td>
                    <td>{order.customer_name}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()] || ""}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Doanh thu theo tháng</h2>
        <div className={styles.chartContainer}>
          {summary.monthly_sales.map((month, index) => (
            <div key={index} className={styles.chartBar}>
              <div className={styles.chartBarFill} style={{ 
                height: `${Math.max((month.sales / Math.max(...summary.monthly_sales.map(m => m.sales || 1))) * 100, 5)}%` 
              }}></div>
              <div className={styles.chartBarLabel}>
                <span>{month.name}</span>
                <span className={styles.chartBarValue}>{formatCurrency(month.sales)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Products */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sản phẩm mới</h2>
        <div className={styles.productsGrid}>
          {summary.new_products.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <img src={product.image} alt={product.name} className={styles.productImage} />
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productPrice}>{product.price}₫</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Thao tác nhanh</h2>
        <div className={styles.actionsGrid}>
          <a href="/admin/products" className={styles.actionCard}>
            <Package size={20} />
            <span>Quản lý sản phẩm</span>
          </a>
          <a href="/admin/orders" className={styles.actionCard}>
            <ShoppingCart size={20} />
            <span>Quản lý đơn hàng</span>
          </a>
          <a href="/admin/customers" className={styles.actionCard}>
            <Users size={20} />
            <span>Quản lý khách hàng</span>
          </a>
          <a href="/admin/categories" className={styles.actionCard}>
            <Package size={20} />
            <span>Quản lý danh mục</span>
          </a>
        </div>
      </div>
    </div>
  );
}

