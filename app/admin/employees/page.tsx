"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { employeesApi, Employee, EmployeeCreateRequest } from "@/app/lib/api/employees";
import { useToast } from "@/app/contexts/ToastContext";
import {
  UserCog,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Search,
} from "lucide-react";
import styles from "./employees.module.css";

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeCreateRequest>({
    TenNV: "",
    ChucVu: "",
    SdtNV: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "Admin") {
      router.push("/admin/dashboard");
      return;
    }
    if (user?.role === "Admin") {
      loadEmployees();
    }
  }, [user, authLoading, router]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeesApi.getAll();
      setEmployees(data || []);
    } catch (err: any) {
      console.error("Error loading employees:", err);
      setError(err.message || "Không thể tải danh sách nhân viên");
      showToast(err.message || "Không thể tải danh sách nhân viên", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        TenNV: employee.TenNV,
        ChucVu: employee.ChucVu,
        SdtNV: employee.SdtNV,
        password: "", // Don't pre-fill password
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        TenNV: "",
        ChucVu: "",
        SdtNV: "",
        password: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      TenNV: "",
      ChucVu: "",
      SdtNV: "",
      password: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TenNV.trim()) {
      setError("Tên nhân viên là bắt buộc");
      return;
    }
    if (!formData.ChucVu.trim()) {
      setError("Chức vụ là bắt buộc");
      return;
    }
    if (!formData.SdtNV.trim()) {
      setError("Số điện thoại là bắt buộc");
      return;
    }
    if (!editingEmployee && !formData.password.trim()) {
      setError("Mật khẩu là bắt buộc khi tạo mới");
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingEmployee) {
        // Update existing employee
        const updateData: any = {
          TenNV: formData.TenNV.trim(),
          ChucVu: formData.ChucVu.trim(),
          SdtNV: formData.SdtNV.trim(),
        };
        if (formData.password.trim()) {
          updateData.password = formData.password.trim();
        }
        await employeesApi.update(editingEmployee.MaNV, updateData);
        showToast("Cập nhật nhân viên thành công", "success");
      } else {
        // Create new employee
        await employeesApi.create({
          TenNV: formData.TenNV.trim(),
          ChucVu: formData.ChucVu.trim(),
          SdtNV: formData.SdtNV.trim(),
          password: formData.password.trim(),
        });
        showToast("Tạo nhân viên mới thành công", "success");
      }

      handleCloseModal();
      loadEmployees();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
      showToast(err.message || "Có lỗi xảy ra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên "${name}"?`)) {
      return;
    }
    try {
      setError(null);
      await employeesApi.delete(id);
      showToast("Xóa nhân viên thành công", "success");
      loadEmployees();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi xóa");
      showToast(err.message || "Có lỗi xảy ra khi xóa", "error");
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.TenNV.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.ChucVu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.SdtNV.includes(searchTerm)
  );

  if (authLoading || user?.role !== "Admin") {
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
          <h1 className={styles.title}>Quản lý tài khoản nhân viên</h1>
          <p className={styles.subtitle}>Chỉ dành cho Admin</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addButton}>
          <Plus size={20} />
          Thêm nhân viên
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

      <div className={styles.searchBar}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, chức vụ hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
                <th>Tên nhân viên</th>
                <th>Chức vụ</th>
                <th>Số điện thoại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    {searchTerm
                      ? "Không tìm thấy nhân viên"
                      : "Chưa có nhân viên nào"}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.MaNV}>
                    <td>{employee.MaNV}</td>
                    <td>{employee.TenNV}</td>
                    <td>{employee.ChucVu}</td>
                    <td>{employee.SdtNV}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleOpenModal(employee)}
                          className={styles.editButton}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(employee.MaNV, employee.TenNV)
                          }
                          className={styles.deleteButton}
                          title="Xóa"
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
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>
                {editingEmployee
                  ? "Chỉnh sửa nhân viên"
                  : "Thêm nhân viên mới"}
              </h2>
              <button onClick={handleCloseModal} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>
                  Tên nhân viên <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.TenNV}
                  onChange={(e) =>
                    setFormData({ ...formData, TenNV: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Chức vụ <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.ChucVu}
                  onChange={(e) =>
                    setFormData({ ...formData, ChucVu: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Số điện thoại <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.SdtNV}
                  onChange={(e) =>
                    setFormData({ ...formData, SdtNV: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Mật khẩu{" "}
                  {editingEmployee ? (
                    <span className={styles.optional}>(để trống nếu không đổi)</span>
                  ) : (
                    <span className={styles.required}>*</span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingEmployee}
                  minLength={6}
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
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
                      {editingEmployee ? "Cập nhật" : "Tạo mới"}
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
