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
  Clock,
} from "lucide-react";
import styles from "./dashboard.module.css";
import { StatCard } from "./components/StatCard";
import { SectionCard } from "./components/SectionCard";
import { RecentOrdersTable } from "./components/RecentOrdersTable";
import { SimpleBarChart } from "./components/SimpleBarChart";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return first.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [rangeRevenue, setRangeRevenue] = useState<number | null>(null);
  const [rangeOrders, setRangeOrders] = useState<number | null>(null);

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
      // Also fetch range metrics (defaults to month-to-date)
      void loadRangeMetrics(startDate, endDate);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      // Safe fallback so UI can still be shown for demo
      setSummary({
        orders_today: 0,
        total_products: 0,
        total_customers: 0,
        recent_orders: [],
        monthly_sales: [],
        new_products: [],
      });
      setError(err.message || "Không thể tải dữ liệu dashboard (đang dùng dữ liệu mock)");
    } finally {
      setLoading(false);
    }
  };

  const loadRangeMetrics = async (s: string, e: string) => {
    try {
      setRangeLoading(true);
      // Prefer /doanhthu if available, fallback to /revenue
      let revenue: { total_revenue: number } | null = null;
      try {
        revenue = await reportsApi.getDoanhThu(s, e);
      } catch {
        revenue = await reportsApi.getRevenue(s, e);
      }
      const orders = await reportsApi.getOrders(s, e);
      setRangeRevenue(revenue?.total_revenue ?? 0);
      setRangeOrders(orders.total_orders ?? 0);
    } catch (err) {
      setRangeRevenue(null);
      setRangeOrders(null);
    } finally {
      setRangeLoading(false);
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

  const monthlySalesForChart =
    (summary.monthly_sales || []).length > 0
      ? summary.monthly_sales.map((m) => ({
          label: m.name,
          value: m.sales || 0,
          tooltip: `${m.name}: ${formatCurrency(m.sales || 0)}`,
        }))
      : [
          { label: "T-2", value: 0 },
          { label: "T-1", value: 0 },
          { label: "T0", value: 0 },
        ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Chào mừng trở lại, {user?.username}!
        </p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          icon={<Clock size={24} />}
          iconBg="#3b82f6"
          label="Đơn hàng hôm nay"
          value={summary.orders_today}
        />

        <StatCard
          icon={<Package size={24} />}
          iconBg="#f59e0b"
          label="Tổng sản phẩm"
          value={summary.total_products}
        />

        <StatCard
          icon={<Users size={24} />}
          iconBg="#8b5cf6"
          label="Tổng khách hàng"
          value={summary.total_customers}
        />

        <StatCard
          icon={<DollarSign size={24} />}
          iconBg="#10b981"
          label="Doanh thu (khoảng chọn)"
          value={rangeRevenue === null ? "—" : formatCurrency(rangeRevenue)}
          subValue={
            rangeOrders === null
              ? "Không có dữ liệu đơn hàng theo khoảng"
              : `Số đơn: ${rangeOrders}`
          }
        />
      </div>

      {/* Recent Orders */}
      <SectionCard
        title="Đơn hàng gần đây"
        right={
          <div className={styles.filters}>
            <input
              className={styles.input}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              className={styles.input}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              className={styles.primaryButton}
              disabled={rangeLoading}
              onClick={() => void loadRangeMetrics(startDate, endDate)}
            >
              {rangeLoading ? "Đang tải..." : "Áp dụng"}
            </button>
          </div>
        }
      >
        <RecentOrdersTable
          orders={summary.recent_orders}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </SectionCard>

      {/* Monthly Sales Chart */}
      <SectionCard title="Doanh thu theo tháng (3 tháng gần nhất)">
        <SimpleBarChart data={monthlySalesForChart} formatValue={formatCurrency} />
      </SectionCard>

      {/* New Products */}
      <SectionCard title="Sản phẩm mới">
        <div className={styles.productsGrid}>
          {summary.new_products.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <img
                src={product.image}
                alt={product.name}
                className={styles.productImage}
              />
              <div className={styles.productInfo}>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productPrice}>{product.price}₫</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

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

