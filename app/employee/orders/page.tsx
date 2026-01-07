"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Truck, Package, RotateCcw, Loader2, AlertCircle, X } from "lucide-react";
import { ordersApi, Order, StatusUpdateResponse } from "@/app/lib/api/orders";
import { useAuth } from "@/app/contexts/AuthContext";
import styles from "./orders.module.css";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; nextActions: string[] }> = {
  Pending: {
    label: "Chờ xử lý",
    color: "#f59e0b",
    icon: Package,
    nextActions: ["Confirmed", "Cancelled"],
  },
  Confirmed: {
    label: "Đã xác nhận",
    color: "#3b82f6",
    icon: CheckCircle,
    nextActions: ["Processing", "Cancelled"],
  },
  Processing: {
    label: "Đang xử lý",
    color: "#8b5cf6",
    icon: Package,
    nextActions: ["Shipped", "Cancelled"],
  },
  Shipped: {
    label: "Đã giao hàng",
    color: "#10b981",
    icon: Truck,
    nextActions: ["Delivered", "Returned"],
  },
  Delivered: {
    label: "Đã giao",
    color: "#059669",
    icon: CheckCircle,
    nextActions: [],
  },
  Cancelled: {
    label: "Đã hủy",
    color: "#ef4444",
    icon: XCircle,
    nextActions: [],
  },
  Returned: {
    label: "Đã trả hàng",
    color: "#dc2626",
    icon: RotateCcw,
    nextActions: [],
  },
};

const ACTION_BUTTONS: Record<string, { label: string; status: string; variant: string }> = {
  Confirm: { label: "Xác nhận", status: "Confirmed", variant: "primary" },
  Process: { label: "Xử lý", status: "Processing", variant: "primary" },
  Ship: { label: "Giao hàng", status: "Shipped", variant: "primary" },
  Deliver: { label: "Hoàn thành", status: "Delivered", variant: "success" },
  Cancel: { label: "Hủy đơn", status: "Cancelled", variant: "danger" },
  Return: { label: "Trả hàng", status: "Returned", variant: "warning" },
};

export default function EmployeeOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // Allow Employee and NhanVien roles
    if (user.role !== "Employee" && user.role !== "NhanVien") {
      setError("Bạn không có quyền truy cập trang này.");
      return;
    }

    loadOrders();
  }, [isAuthenticated, user, authLoading, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getAll();
      const sorted = data.sort((a, b) => new Date(b.NgayDat).getTime() - new Date(a.NgayDat).getTime());
      setOrders(sorted);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đơn hàng");
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      setError(null);
      setSuccessMessage(null);

      const response: StatusUpdateResponse = await ordersApi.updateStatus(orderId, newStatus);

      setSuccessMessage(response.message);
      await loadOrders();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      if (err.message) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes("tồn kho") || errorMessage.includes("stock") || errorMessage.includes("insufficient")) {
          setError(
            `⚠️ Không đủ tồn kho: ${err.message}. Vui lòng kiểm tra số lượng sản phẩm trong kho trước khi xác nhận đơn hàng.`
          );
        } else {
          setError(`❌ ${err.message}`);
        }
      } else {
        setError("Có lỗi xảy ra khi cập nhật trạng thái đơn hàng");
      }
      console.error("Error updating order status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Map Vietnamese status to English status for compatibility
  const normalizeStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      "Chờ thanh toán": "Pending",
      "Chờ xử lý": "Pending",
      "Đã xác nhận": "Confirmed",
      "Đang xử lý": "Processing",
      "Đã giao hàng": "Shipped",
      "Đã giao": "Delivered",
      "Đã hủy": "Cancelled",
      "Đã trả hàng": "Returned",
      "PENDING_PAYMENT": "Pending",
      "PAID": "Confirmed",
    };
    return statusMap[status] || status;
  };

  const getStatusConfig = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const config = STATUS_CONFIG[normalizedStatus];
    if (config) {
      return {
        ...config,
        label: status, // Keep original Vietnamese label if it's Vietnamese
      };
    }
    return {
      label: status,
      color: "#6b7280",
      icon: Package,
      nextActions: [],
    };
  };

  const getAvailableActions = (currentStatus: string): string[] => {
    const normalizedStatus = normalizeStatus(currentStatus);
    const config = STATUS_CONFIG[normalizedStatus];
    return config ? config.nextActions : [];
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

  const formatPromotion = (khuyenMai: string | null | undefined) => {
    if (!khuyenMai) return "—";
    const promoStr = String(khuyenMai);
    const match = promoStr.match(/(\d+)/);
    if (match) {
      const discountPercent = match[1];
      return (
        <span className={styles.promotionCode} title={`Mã giảm giá: ${promoStr}`}>
          {promoStr} <span className={styles.discountPercent}>({discountPercent}%)</span>
        </span>
      );
    }
    return <span className={styles.promotionCode} title={`Mã giảm giá: ${promoStr}`}>{promoStr}</span>;
  };

  const getActionButton = (actionStatus: string) => {
    const actionMap: Record<string, string> = {
      Confirmed: "Confirm",
      Processing: "Process",
      Shipped: "Ship",
      Delivered: "Deliver",
      Cancelled: "Cancel",
      Returned: "Return",
    };
    return actionMap[actionStatus] || actionStatus;
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý đơn hàng</h1>
          <p className={styles.subtitle}>Tổng số đơn hàng: {orders.length}</p>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={20} />
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.closeError}>
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className={styles.successMessage}>
          <CheckCircle size={20} />
          <p>{successMessage}</p>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Khuyến mãi</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusConfig = getStatusConfig(order.TrangThai);
                const StatusIcon = statusConfig.icon;
                const availableActions = getAvailableActions(order.TrangThai);
                const isUpdating = updatingStatus === order.MaDonHang;

                return (
                  <tr key={order.MaDonHang}>
                    <td className={styles.orderId}>#{order.MaDonHang}</td>
                    <td>{formatDate(order.NgayDat)}</td>
                    <td className={styles.price}>{formatPrice(order.TongTien)}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
                      >
                        <StatusIcon size={14} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td>{formatPromotion(order.KhuyenMai)}</td>
                    <td>
                      <div className={styles.actions}>
                        {isUpdating ? (
                          <Loader2 className={styles.spinnerSmall} />
                        ) : (
                          availableActions.map((actionStatus) => {
                            const actionKey = getActionButton(actionStatus);
                            const actionConfig = ACTION_BUTTONS[actionKey];
                            if (!actionConfig) return null;

                            return (
                              <button
                                key={actionStatus}
                                onClick={() => handleStatusUpdate(order.MaDonHang, actionStatus)}
                                className={`${styles.actionButton} ${styles[actionConfig.variant]}`}
                                title={actionConfig.label}
                              >
                                {actionConfig.label}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

