"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { productsApi, Product } from "@/app/lib/api/products";
import { inventoryApi } from "@/app/lib/api/inventory";
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import styles from "./inventory.module.css";

export default function InventoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out">("all");
  const [threshold, setThreshold] = useState(10);
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [stockChange, setStockChange] = useState<{ [key: number]: number }>({});

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
      
      loadInventory();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all products and low stock alerts
      const [productsData, lowStockData] = await Promise.all([
        productsApi.getAll(1, 1000, false, {}),
        inventoryApi.getLowStock(threshold),
      ]);

      setProducts(productsData.products || []);
      setLowStockProducts(lowStockData.products || []);
    } catch (err: any) {
      console.error("Error loading inventory:", err);
      setError(err.message || "Không thể tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId: number, operation: "add" | "subtract") => {
    const change = stockChange[productId] || 0;
    if (change <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ");
      return;
    }

    try {
      const result = await inventoryApi.updateStock({
        product_id: productId,
        quantity_change: change,
        operation,
      });

      if (result.success) {
        alert(result.message);
        setEditingStock(null);
        setStockChange({ ...stockChange, [productId]: 0 });
        loadInventory();
      } else {
        alert(result.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật tồn kho");
    }
  };

  const getStockStatus = (quantity: number): "normal" | "low" | "out" => {
    if (quantity === 0) return "out";
    if (quantity <= threshold) return "low";
    return "normal";
  };

  const getStockStatusLabel = (quantity: number): string => {
    const status = getStockStatus(quantity);
    if (status === "out") return "Hết hàng";
    if (status === "low") return "Sắp hết";
    return "Còn hàng";
  };

  const filteredProducts = products.filter((product) => {
    // Search filter
    if (searchTerm && !product.TenSP.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filterStatus === "low") {
      return product.SoLuongTonKho > 0 && product.SoLuongTonKho <= threshold;
    }
    if (filterStatus === "out") {
      return product.SoLuongTonKho === 0;
    }

    return true;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải dữ liệu tồn kho...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý tồn kho</h1>
          <p className={styles.subtitle}>Theo dõi và cập nhật số lượng sản phẩm</p>
        </div>
        <button onClick={loadInventory} className={styles.refreshButton}>
          <RefreshCw size={18} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={loadInventory} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className={styles.alertSection}>
          <div className={styles.alertHeader}>
            <AlertTriangle size={20} />
            <h2>Cảnh báo sắp hết hàng ({lowStockProducts.length} sản phẩm)</h2>
          </div>
          <div className={styles.alertGrid}>
            {lowStockProducts.slice(0, 5).map((product) => (
              <div key={product.MaSP} className={styles.alertCard}>
                <Package size={24} />
                <div>
                  <p className={styles.alertProductName}>{product.TenSP}</p>
                  <p className={styles.alertQuantity}>
                    Còn lại: {product.SoLuongTonKho} (Ngưỡng: {product.Threshold || threshold})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <Filter size={18} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | "low" | "out")}
          >
            <option value="all">Tất cả</option>
            <option value="low">Sắp hết hàng</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>
        <div className={styles.thresholdGroup}>
          <label>Ngưỡng cảnh báo:</label>
          <input
            type="number"
            min="1"
            value={threshold}
            onChange={(e) => {
              const newThreshold = parseInt(e.target.value) || 10;
              setThreshold(newThreshold);
            }}
            onBlur={loadInventory}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>
            Danh sách sản phẩm ({filteredProducts.length})
          </h2>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã SP</th>
                <th>Tên sản phẩm</th>
                <th>Số lượng tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product.SoLuongTonKho);
                  const isEditing = editingStock === product.MaSP;
                  
                  return (
                    <tr key={product.MaSP} className={status === "out" ? styles.outOfStock : ""}>
                      <td>{product.MaSP}</td>
                      <td className={styles.productName}>{product.TenSP}</td>
                      <td className={styles.quantityCell}>
                        {isEditing ? (
                          <div className={styles.editStock}>
                            <input
                              type="number"
                              min="0"
                              value={stockChange[product.MaSP] || ""}
                              onChange={(e) =>
                                setStockChange({
                                  ...stockChange,
                                  [product.MaSP]: parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="Số lượng"
                              className={styles.stockInput}
                            />
                            <div className={styles.stockActions}>
                              <button
                                onClick={() => handleStockUpdate(product.MaSP, "add")}
                                className={styles.addButton}
                                title="Thêm"
                              >
                                <Plus size={16} />
                              </button>
                              <button
                                onClick={() => handleStockUpdate(product.MaSP, "subtract")}
                                className={styles.subtractButton}
                                title="Trừ"
                              >
                                <Minus size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStock(null);
                                  setStockChange({ ...stockChange, [product.MaSP]: 0 });
                                }}
                                className={styles.cancelButton}
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className={styles.quantityValue}>
                            {product.SoLuongTonKho}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            status === "out"
                              ? styles.statusOut
                              : status === "low"
                              ? styles.statusLow
                              : styles.statusNormal
                          }`}
                        >
                          {getStockStatusLabel(product.SoLuongTonKho)}
                        </span>
                      </td>
                      <td>
                        {!isEditing ? (
                          <button
                            onClick={() => setEditingStock(product.MaSP)}
                            className={styles.editButton}
                          >
                            Cập nhật
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    Không tìm thấy sản phẩm
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

