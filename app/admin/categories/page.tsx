"use client";

import { useState, useEffect } from "react";
import { categoriesApi } from "@/app/lib/api/products";
import { Plus, Edit, Trash2, X, Save, Loader2 } from "lucide-react";
import styles from "./categories.module.css";

interface Category {
  MaDanhMuc: number;
  TenDanhMuc: string;
  IsDelete: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ TenDanhMuc: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.getAll();
      setCategories(data.filter((cat: Category) => !cat.IsDelete));
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ TenDanhMuc: category.TenDanhMuc });
    } else {
      setEditingCategory(null);
      setFormData({ TenDanhMuc: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ TenDanhMuc: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TenDanhMuc.trim()) {
      setError("Tên danh mục là bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      if (editingCategory) {
        // Update existing category
        await categoriesApi.update(editingCategory.MaDanhMuc, {
          TenDanhMuc: formData.TenDanhMuc.trim(),
        });
      } else {
        // Create new category
        await categoriesApi.create({
          TenDanhMuc: formData.TenDanhMuc.trim(),
        });
      }
      
      handleCloseModal();
      loadCategories();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      return;
    }
    try {
      setError(null);
      await categoriesApi.delete(id);
      loadCategories();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi xóa");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý danh mục</h1>
          <p className={styles.subtitle}>Quản lý các danh mục sản phẩm</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addButton}>
          <Plus size={20} />
          Thêm danh mục
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

      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} />
          <p>Đang tải...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyCell}>
                    Chưa có danh mục nào
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.MaDanhMuc}>
                    <td>{category.MaDanhMuc}</td>
                    <td>{category.TenDanhMuc}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleOpenModal(category)}
                          className={styles.editButton}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(category.MaDanhMuc, category.TenDanhMuc)
                          }
                          className={styles.deleteButton}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h2>
              <button onClick={handleCloseModal} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.TenDanhMuc}
                  onChange={(e) =>
                    setFormData({ ...formData, TenDanhMuc: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseModal} disabled={submitting}>
                  Hủy
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className={styles.spinnerSmall} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingCategory ? "Cập nhật" : "Tạo mới"}
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

