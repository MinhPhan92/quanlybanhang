"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Calendar, DollarSign, Users, CheckCircle, XCircle } from "lucide-react";
import { promotionsApi, Voucher } from "@/app/lib/api/promotions";
import { useToast } from "@/app/contexts/ToastContext";
import styles from "./promotions.module.css";

export default function PromotionsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await promotionsApi.getList();
      setVouchers(data.vouchers || []);
    } catch (err: any) {
      console.error("Error loading vouchers:", err);
      setError(err.message || "Không thể tải danh sách khuyến mãi");
      showToast(err.message || "Không thể tải danh sách khuyến mãi", "error");
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

  const isExpired = (validTo: string) => {
    return new Date(validTo) < new Date();
  };

  const isActive = (voucher: Voucher) => {
    return voucher.is_active && !isExpired(voucher.valid_to) && voucher.remaining_uses > 0;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý khuyến mãi</h1>
          <p className={styles.subtitle}>Xem và quản lý các mã giảm giá</p>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={loadVouchers}>Thử lại</button>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Tag size={24} />
          <div>
            <p className={styles.statLabel}>Tổng số mã</p>
            <p className={styles.statValue}>{vouchers.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={24} />
          <div>
            <p className={styles.statLabel}>Đang hoạt động</p>
            <p className={styles.statValue}>
              {vouchers.filter((v) => isActive(v)).length}
            </p>
          </div>
        </div>
        <div className={styles.statCard}>
          <XCircle size={24} />
          <div>
            <p className={styles.statLabel}>Đã hết hạn</p>
            <p className={styles.statValue}>
              {vouchers.filter((v) => isExpired(v.valid_to)).length}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã giảm giá</th>
              <th>Tên chương trình</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đơn tối thiểu</th>
              <th>Giảm tối đa</th>
              <th>Hiệu lực</th>
              <th>Sử dụng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyCell}>
                  Chưa có mã khuyến mãi nào
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.code}>
                  <td>
                    <strong className={styles.voucherCode}>{voucher.code}</strong>
                  </td>
                  <td>{voucher.name}</td>
                  <td>
                    <span className={styles.badge}>
                      {voucher.type === "percentage" ? "Phần trăm" : "Cố định"}
                    </span>
                  </td>
                  <td>
                    {voucher.type === "percentage"
                      ? `${voucher.discount_value}%`
                      : formatCurrency(voucher.discount_value)}
                  </td>
                  <td>{formatCurrency(voucher.min_order_amount)}</td>
                  <td>
                    {voucher.max_discount
                      ? formatCurrency(voucher.max_discount)
                      : "Không giới hạn"}
                  </td>
                  <td>
                    <div className={styles.dateRange}>
                      <Calendar size={14} />
                      {formatDate(voucher.valid_from)} - {formatDate(voucher.valid_to)}
                    </div>
                  </td>
                  <td>
                    <div className={styles.usageInfo}>
                      <Users size={14} />
                      {voucher.used_count}/{voucher.usage_limit} (
                      {voucher.remaining_uses} còn lại)
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        isActive(voucher)
                          ? styles.statusActive
                          : isExpired(voucher.valid_to)
                          ? styles.statusExpired
                          : styles.statusInactive
                      }`}
                    >
                      {isActive(voucher) ? (
                        <>
                          <CheckCircle size={14} />
                          Hoạt động
                        </>
                      ) : isExpired(voucher.valid_to) ? (
                        <>
                          <XCircle size={14} />
                          Hết hạn
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Không hoạt động
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
