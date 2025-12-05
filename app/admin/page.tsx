"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
      } else {
        router.push("/admin/dashboard");
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  return null;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    TenProject: "",
    MoTa: "",
    TrangThai: "Active",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Check authentication and admin role
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    if (user.role !== "Admin" && user.role !== "Manager") {
      setError("Bạn không có quyền truy cập trang này. Chỉ Admin và Manager mới có quyền.");
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
    loadProjects();
  }, [isAuthenticated, user, isLoading, router]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách dự án");
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        TenProject: project.TenProject,
        MoTa: project.MoTa || "",
        TrangThai: project.TrangThai,
      });
    } else {
      setEditingProject(null);
      setFormData({
        TenProject: "",
        MoTa: "",
        TrangThai: "Active",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({
      TenProject: "",
      MoTa: "",
      TrangThai: "Active",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.TenProject.trim()) {
      setError("Tên dự án là bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingProject) {
        // Update existing project
        const updateData: ProjectUpdateRequest = {
          TenProject: formData.TenProject,
          MoTa: formData.MoTa || undefined,
          TrangThai: formData.TrangThai,
        };
        await projectsApi.update(editingProject.MaProject, updateData);
      } else {
        // Create new project
        const createData: ProjectCreateRequest = {
          TenProject: formData.TenProject,
          MoTa: formData.MoTa || undefined,
          TrangThai: formData.TrangThai,
        };
        await projectsApi.create(createData);
      }

      handleCloseModal();
      loadProjects();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi lưu dự án");
      console.error("Error saving project:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa dự án "${name}"?`)) {
      return;
    }

    try {
      setError(null);
      await projectsApi.delete(id);
      loadProjects();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi xóa dự án");
      console.error("Error deleting project:", err);
    }
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return styles.statusActive;
      case "Inactive":
        return styles.statusInactive;
      case "Completed":
        return styles.statusCompleted;
      default:
        return styles.statusActive;
    }
  };

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h1>Không có quyền truy cập</h1>
          <p>{error || "Bạn không có quyền truy cập trang này."}</p>
          <button onClick={() => (window.location.href = "/")} className={styles.backButton}>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý dự án</h1>
          <p className={styles.subtitle}>Tạo và quản lý các dự án riêng biệt</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addButton}>
          <Plus size={20} />
          Tạo dự án mới
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
          <p>Đang tải danh sách dự án...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Chưa có dự án nào. Hãy tạo dự án đầu tiên!</p>
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {projects.map((project) => (
            <div key={project.MaProject} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h3 className={styles.projectTitle}>{project.TenProject}</h3>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(project.TrangThai)}`}>
                  {project.TrangThai}
                </span>
              </div>
              
              {project.MoTa && (
                <p className={styles.projectDescription}>{project.MoTa}</p>
              )}
              
              <div className={styles.projectMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Ngày tạo:</span>
                  <span className={styles.metaValue}>{formatDate(project.NgayTao)}</span>
                </div>
                {project.TenNVCreate && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Người tạo:</span>
                    <span className={styles.metaValue}>{project.TenNVCreate}</span>
                  </div>
                )}
              </div>

              <div className={styles.projectActions}>
                <button
                  onClick={() => handleOpenModal(project)}
                  className={styles.editButton}
                  title="Chỉnh sửa"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(project.MaProject, project.TenProject)}
                  className={styles.deleteButton}
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProject ? "Chỉnh sửa dự án" : "Tạo dự án mới"}</h2>
              <button onClick={handleCloseModal} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="TenProject" className={styles.label}>
                  Tên dự án <span className={styles.required}>*</span>
                </label>
                <input
                  id="TenProject"
                  type="text"
                  value={formData.TenProject}
                  onChange={(e) => setFormData({ ...formData, TenProject: e.target.value })}
                  className={styles.input}
                  placeholder="Nhập tên dự án"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="MoTa" className={styles.label}>
                  Mô tả
                </label>
                <textarea
                  id="MoTa"
                  value={formData.MoTa}
                  onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                  className={styles.textarea}
                  placeholder="Nhập mô tả dự án (tùy chọn)"
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="TrangThai" className={styles.label}>
                  Trạng thái
                </label>
                <select
                  id="TrangThai"
                  value={formData.TrangThai}
                  onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
                  className={styles.select}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
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
                      {editingProject ? "Cập nhật" : "Tạo mới"}
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

