"use client";

import { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";
import styles from "./customers.module.css";

interface Customer {
  MaKH: number;
  TenKH: string;
  SdtKH: string;
  EmailKH: string;
  DiaChiKH: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      // const data = await customersApi.getAll();
      // setCustomers(data);
      setCustomers([]);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.TenKH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.EmailKH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.SdtKH.includes(searchTerm)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý khách hàng</h1>
          <p className={styles.subtitle}>Xem và quản lý thông tin khách hàng</p>
        </div>
      </div>

      <div className={styles.searchBar}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên khách hàng</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Địa chỉ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    {searchTerm ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.MaKH}>
                    <td>{customer.MaKH}</td>
                    <td>{customer.TenKH}</td>
                    <td>{customer.SdtKH}</td>
                    <td>{customer.EmailKH}</td>
                    <td>{customer.DiaChiKH}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

