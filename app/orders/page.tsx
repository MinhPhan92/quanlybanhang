"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/shared/header/Header";
import Footer from "@/app/components/shared/footer/Footer";
import { useAuth } from "@/app/contexts/AuthContext";
import { ordersApi, Order } from "@/app/lib/api/orders";
import { Package, Search, Filter } from "lucide-react";
import styles from "./orders.module.css";

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, isLoading, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getMyOrders();
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đơn hàng");
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      "Chờ thanh toán": "#f59e0b",
      "Chờ xử lý": "#3b82f6",
      "Đang xử lý": "#8b5cf6",
      "Đang giao hàng": "#06b6d4",
      "Đã giao hàng": "#10b981",
      "Đã hủy": "#ef4444",
      "Đã hoàn trả": "#6b7280",
      // English fallbacks
      Pending: "#f59e0b",
      Confirmed: "#3b82f6",
      Processing: "#8b5cf6",
      Shipped: "#06b6d4",
      Delivered: "#10b981",
      Cancelled: "#ef4444",
      Returned: "#6b7280",
    };
    return statusMap[status] || "#6b7280";
  };

  const getStatusLabel = (status: string) => {
    // Backend already returns Vietnamese status
    return status;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.TrangThai === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      order.MaDonHang.toString().includes(searchTerm) ||
      order.TongTien.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  if (isLoading || loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <p>Đang tải...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Đơn Hàng Của Tôi</h1>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.statusFilter}>
              <Filter size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Chờ thanh toán">Chờ thanh toán</option>
                <option value="Chờ xử lý">Chờ xử lý</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đang giao hàng">Đang giao hàng</option>
                <option value="Đã giao hàng">Đã giao hàng</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          {error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
              <button onClick={loadOrders} className={styles.retryButton}>
                Thử lại
              </button>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className={styles.ordersList}>
              {filteredOrders.map((order) => (
                <Link
                  key={order.MaDonHang}
                  href={`/order/${order.MaDonHang}`}
                  className={styles.orderCard}
                >
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <Package size={24} />
                      <div>
                        <h3 className={styles.orderNumber}>
                          Đơn hàng #{order.MaDonHang}
                        </h3>
                        <p className={styles.orderDate}>
                          {new Date(order.NgayDat).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: `${getStatusColor(order.TrangThai)}20`,
                        color: getStatusColor(order.TrangThai),
                      }}
                    >
                      {getStatusLabel(order.TrangThai)}
                    </div>
                  </div>
                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.TongTien)}
                    </span>
                    <span className={styles.viewDetails}>Xem chi tiết →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyContainer}>
              <Package size={48} color="#9ca3af" />
              <h2 className={styles.emptyTitle}>Chưa có đơn hàng nào</h2>
              <p className={styles.emptyText}>
                Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm!
              </p>
              <Link href="/shop" className={styles.shopButton}>
                Mua sắm ngay
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
