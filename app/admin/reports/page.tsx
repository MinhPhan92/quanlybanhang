"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { reportsApi } from "@/app/lib/api/reports";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  Download,
} from "lucide-react";
import styles from "./reports.module.css";
import { SimpleBarChart } from "../dashboard/components/SimpleBarChart";

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return first.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });

  // Report data state
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{ name: string; sales: number }>>([]);
  const [topSelling, setTopSelling] = useState<Array<{ TenSP: string; SoLuongBan: number }>>([]);

  useEffect(() => {
    if (!isLoading) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token || !isAuthenticated) {
        router.push("/login");
        return;
      }
      
      if (user && !["Admin", "Manager"].includes(user.role || "")) {
        router.push("/");
        return;
      }
      
      loadReports();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all reports in parallel
      const [revenueData, ordersData, bestSellingData] = await Promise.all([
        reportsApi.getDoanhThu(startDate, endDate).catch(() => 
          reportsApi.getRevenue(startDate, endDate)
        ),
        reportsApi.getOrders(startDate, endDate),
        reportsApi.getBestSelling(10),
      ]);

      setTotalRevenue(revenueData.total_revenue || 0);
      setTotalOrders(ordersData.total_orders || 0);
      setTopSelling(bestSellingData || []);

      // Load monthly revenue (last 6 months)
      const now = new Date();
      const monthlyData: Array<{ name: string; sales: number }> = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthStartStr = monthDate.toISOString().slice(0, 10);
        const monthEndStr = monthEnd.toISOString().slice(0, 10);
        
        try {
          const monthRevenue = await reportsApi.getDoanhThu(monthStartStr, monthEndStr).catch(() =>
            reportsApi.getRevenue(monthStartStr, monthEndStr)
          );
          monthlyData.push({
            name: `T${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`,
            sales: monthRevenue.total_revenue || 0,
          });
        } catch (err) {
          monthlyData.push({
            name: `T${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`,
            sales: 0,
          });
        }
      }
      
      setMonthlyRevenue(monthlyData);
    } catch (err: any) {
      console.error("Error loading reports:", err);
      setError(err.message || "Không thể tải báo cáo");
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

  const handleDateRangeChange = () => {
    loadReports();
  };

  const exportReport = () => {
    // Simple CSV export
    const csvContent = [
      ["Báo cáo", "Giá trị"],
      ["Tổng đơn hàng", totalOrders.toString()],
      ["Tổng doanh thu", totalRevenue.toString()],
      ["", ""],
      ["Top sản phẩm bán chạy", ""],
      ["Tên sản phẩm", "Số lượng bán"],
      ...topSelling.map(item => [item.TenSP, item.SoLuongBan.toString()]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bao-cao-${startDate}-${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải báo cáo...</p>
      </div>
    );
  }

  const monthlyChartData = monthlyRevenue.map((m) => ({
    label: m.name,
    value: m.sales || 0,
    tooltip: `${m.name}: ${formatCurrency(m.sales || 0)}`,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Báo cáo & Phân tích</h1>
          <p className={styles.subtitle}>Thống kê doanh thu và đơn hàng</p>
        </div>
        <button onClick={exportReport} className={styles.exportButton}>
          <Download size={18} />
          Xuất báo cáo
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={loadReports} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      )}

      {/* Date Range Filter */}
      <div className={styles.dateFilter}>
        <div className={styles.dateInputGroup}>
          <label>
            <Calendar size={16} />
            Từ ngày
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className={styles.dateInputGroup}>
          <label>
            <Calendar size={16} />
            Đến ngày
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={handleDateRangeChange}
          className={styles.applyButton}
          disabled={loading}
        >
          Áp dụng
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#3b82f6" }}>
            <ShoppingCart size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Tổng đơn hàng</p>
            <p className={styles.statValue}>{totalOrders.toLocaleString()}</p>
            <p className={styles.statSubtext}>Trong khoảng thời gian đã chọn</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#10b981" }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Tổng doanh thu</p>
            <p className={styles.statValue}>{formatCurrency(totalRevenue)}</p>
            <p className={styles.statSubtext}>Trong khoảng thời gian đã chọn</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: "#f59e0b" }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Trung bình/đơn</p>
            <p className={styles.statValue}>
              {totalOrders > 0 
                ? formatCurrency(totalRevenue / totalOrders)
                : formatCurrency(0)
              }
            </p>
            <p className={styles.statSubtext}>Doanh thu trung bình mỗi đơn</p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Doanh thu theo tháng (6 tháng gần nhất)</h2>
        <div className={styles.chartContainer}>
          <SimpleBarChart 
            data={monthlyChartData} 
            formatValue={formatCurrency}
          />
        </div>
      </div>

      {/* Top Selling Products */}
      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>Top sản phẩm bán chạy</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên sản phẩm</th>
                <th>Số lượng bán</th>
              </tr>
            </thead>
            <tbody>
              {topSelling.length > 0 ? (
                topSelling.map((product, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{product.TenSP}</td>
                    <td className={styles.quantityCell}>
                      {product.SoLuongBan.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className={styles.emptyCell}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

