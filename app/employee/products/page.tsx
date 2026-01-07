"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, X, Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { productsApi, categoriesApi, Product, ProductCreateRequest, ProductUpdateRequest, Category } from "@/app/lib/api/products";
import { useAuth } from "@/app/contexts/AuthContext";
import styles from "./products.module.css";

interface AttributePair {
  key: string;
  value: string;
}

export default function EmployeeProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  
  // Only Admin can delete products
  const canDelete = user?.role === "Admin";

  const [formData, setFormData] = useState({
    TenSP: "",
    GiaSP: "",
    SoLuongTonKho: "",
    MaDanhMuc: "",
  });

  const [attributes, setAttributes] = useState<AttributePair[]>([]);

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

    loadCategories();
    loadProducts();
  }, [isAuthenticated, user, authLoading, router, currentPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsApi.getAll(currentPage, pageSize, true);
      setProducts(response.products);
      setTotalProducts(response.total);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách sản phẩm");
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err: any) {
      console.error("Error loading categories:", err);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        TenSP: product.TenSP,
        GiaSP: product.GiaSP.toString(),
        SoLuongTonKho: product.SoLuongTonKho.toString(),
        MaDanhMuc: product.MaDanhMuc?.toString() || "",
      });
      if (product.attributes && typeof product.attributes === "object") {
        const pairs: AttributePair[] = Object.entries(product.attributes).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setAttributes(pairs.length > 0 ? pairs : [{ key: "", value: "" }]);
      } else {
        setAttributes([{ key: "", value: "" }]);
      }
    } else {
      setEditingProduct(null);
      setFormData({
        TenSP: "",
        GiaSP: "",
        SoLuongTonKho: "",
        MaDanhMuc: "",
      });
      setAttributes([{ key: "", value: "" }]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      TenSP: "",
      GiaSP: "",
      SoLuongTonKho: "",
      MaDanhMuc: "",
    });
    setAttributes([{ key: "", value: "" }]);
  };

  const handleAttributeChange = (index: number, field: "key" | "value", value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  const handleRemoveAttribute = (index: number) => {
    if (attributes.length > 1) {
      setAttributes(attributes.filter((_, i) => i !== index));
    }
  };

  const convertAttributesToObject = (): Record<string, any> | undefined => {
    const filtered = attributes.filter((attr) => attr.key.trim() !== "");
    if (filtered.length === 0) return undefined;

    const obj: Record<string, any> = {};
    filtered.forEach((attr) => {
      const key = attr.key.trim();
      const value = attr.value.trim();
      if (value === "true") obj[key] = true;
      else if (value === "false") obj[key] = false;
      else if (!isNaN(Number(value)) && value !== "") obj[key] = Number(value);
      else obj[key] = value;
    });
    return obj;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.TenSP.trim()) {
      setError("Tên sản phẩm là bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const attributesObj = convertAttributesToObject();

      if (editingProduct) {
        const updateData: ProductUpdateRequest = {
          TenSP: formData.TenSP,
          GiaSP: formData.GiaSP ? parseFloat(formData.GiaSP) : undefined,
          SoLuongTonKho: formData.SoLuongTonKho ? parseInt(formData.SoLuongTonKho) : undefined,
          MaDanhMuc: formData.MaDanhMuc ? parseInt(formData.MaDanhMuc) : undefined,
          attributes: attributesObj,
        };
        await productsApi.update(editingProduct.MaSP, updateData);
      } else {
        if (!formData.GiaSP || !formData.SoLuongTonKho) {
          setError("Giá và số lượng tồn kho là bắt buộc");
          return;
        }
        const createData: ProductCreateRequest = {
          TenSP: formData.TenSP,
          GiaSP: parseFloat(formData.GiaSP),
          SoLuongTonKho: parseInt(formData.SoLuongTonKho),
          MaDanhMuc: formData.MaDanhMuc ? parseInt(formData.MaDanhMuc) : undefined,
          attributes: attributesObj,
        };
        await productsApi.create(createData);
      }

      handleCloseModal();
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi lưu sản phẩm");
      console.error("Error saving product:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!canDelete) {
      setError("Chỉ Admin mới có quyền xóa sản phẩm");
      return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
      return;
    }

    try {
      setError(null);
      await productsApi.delete(id);
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi xóa sản phẩm");
      console.error("Error deleting product:", err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const totalPages = Math.ceil(totalProducts / pageSize);

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
          <h1 className={styles.title}>Quản lý sản phẩm</h1>
          <p className={styles.subtitle}>Tổng số sản phẩm: {totalProducts}</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addButton}>
          <Plus size={20} />
          Tạo sản phẩm mới
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.closeError}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Danh mục</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  Chưa có sản phẩm nào. Hãy tạo sản phẩm đầu tiên!
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.MaSP}>
                  <td>{product.MaSP}</td>
                  <td className={styles.productName}>{product.TenSP}</td>
                  <td>{formatPrice(product.GiaSP)}</td>
                  <td>{product.SoLuongTonKho}</td>
                  <td>{product.TenDanhMuc || "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleOpenModal(product)}
                        className={styles.editButton}
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(product.MaSP, product.TenSP)}
                          className={styles.deleteButton}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            <ChevronLeft size={16} />
            Trước
          </button>
          <span className={styles.pageInfo}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Sau
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProduct ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}</h2>
              <button onClick={handleCloseModal} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="TenSP" className={styles.label}>
                  Tên sản phẩm <span className={styles.required}>*</span>
                </label>
                <input
                  id="TenSP"
                  type="text"
                  value={formData.TenSP}
                  onChange={(e) => setFormData({ ...formData, TenSP: e.target.value })}
                  className={styles.input}
                  placeholder="Nhập tên sản phẩm"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="GiaSP" className={styles.label}>
                    Giá <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="GiaSP"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.GiaSP}
                    onChange={(e) => setFormData({ ...formData, GiaSP: e.target.value })}
                    className={styles.input}
                    placeholder="0"
                    required={!editingProduct}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="SoLuongTonKho" className={styles.label}>
                    Số lượng tồn kho <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="SoLuongTonKho"
                    type="number"
                    min="0"
                    value={formData.SoLuongTonKho}
                    onChange={(e) => setFormData({ ...formData, SoLuongTonKho: e.target.value })}
                    className={styles.input}
                    placeholder="0"
                    required={!editingProduct}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="MaDanhMuc" className={styles.label}>
                  Danh mục
                </label>
                <select
                  id="MaDanhMuc"
                  value={formData.MaDanhMuc}
                  onChange={(e) => setFormData({ ...formData, MaDanhMuc: e.target.value })}
                  className={styles.select}
                >
                  <option value="">— Chọn danh mục —</option>
                  {categories.map((cat) => (
                    <option key={cat.MaDanhMuc} value={cat.MaDanhMuc}>
                      {cat.TenDanhMuc}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.attributesSection}>
                <div className={styles.attributesHeader}>
                  <label className={styles.label}>Thuộc tính sản phẩm (JSON Key-Value)</label>
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className={styles.addAttributeButton}
                  >
                    <Plus size={16} />
                    Thêm thuộc tính
                  </button>
                </div>
                <div className={styles.attributesList}>
                  {attributes.map((attr, index) => (
                    <div key={index} className={styles.attributeRow}>
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) => handleAttributeChange(index, "key", e.target.value)}
                        className={styles.attributeKey}
                        placeholder="Tên thuộc tính (ví dụ: Màu sắc)"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                        className={styles.attributeValue}
                        placeholder="Giá trị (ví dụ: Đỏ)"
                      />
                      {attributes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(index)}
                          className={styles.removeAttributeButton}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className={styles.attributesHint}>
                  Các thuộc tính sẽ được lưu dưới dạng JSON trong cột MoTa. Giá trị số sẽ được tự động chuyển đổi.
                </p>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.cancelButton}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className={styles.spinnerSmall} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingProduct ? "Cập nhật" : "Tạo mới"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

