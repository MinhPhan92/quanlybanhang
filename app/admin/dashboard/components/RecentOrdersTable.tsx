"use client";

import styles from "../dashboard.module.css";

export type RecentOrderRow = {
  id: number;
  code: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string | null;
};

export function RecentOrdersTable({
  orders,
  formatCurrency,
  formatDate,
}: {
  orders: RecentOrderRow[];
  formatCurrency: (n: number) => string;
  formatDate: (s: string | null) => string;
}) {
  return (
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
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.emptyCell}>
                Chưa có đơn hàng nào
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td>{order.code}</td>
                <td>{order.customer_name}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[order.status.toLowerCase()] || ""
                    }`}
                  >
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
  );
}


