"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { reviewsApi, Review } from "@/app/lib/api/reviews";
import { complaintsApi, Complaint } from "@/app/lib/api/complaints";
import { authApi } from "@/app/lib/api/auth";
import { useToast } from "@/app/contexts/ToastContext";
import { User, Mail, Phone, MapPin, Edit, Save, X, Star, MessageSquare, Trash2, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import styles from "./profile.module.css";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "reviews" | "complaints">("profile");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const { showToast } = useToast();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      // TODO: Load user profile data from API
      setFormData({
        fullName: user.username || "",
        email: "",
        phone: "",
        address: "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === "KhachHang") {
      if (activeTab === "reviews") {
        loadReviews();
      } else if (activeTab === "complaints") {
        loadComplaints();
      }
    }
  }, [activeTab, user]);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const data = await reviewsApi.getMyReviews();
      setReviews(data || []);
    } catch (err: any) {
      console.error("Error loading reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const data = await complaintsApi.getMyComplaints();
      setComplaints(data || []);
    } catch (err: any) {
      console.error("Error loading complaints:", err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await reviewsApi.deleteReview(reviewId);
      alert("Đã xóa đánh giá thành công");
      loadReviews();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa đánh giá");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implement update profile API call
      alert("Chức năng cập nhật thông tin sẽ được triển khai sau");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isCustomer = user?.role === "KhachHang";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Thông tin cá nhân</h1>
        <p className={styles.subtitle}>Quản lý thông tin tài khoản của bạn</p>
      </div>

      {isCustomer && (
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "profile" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={18} />
            Thông tin
          </button>
          <button
            className={`${styles.tab} ${activeTab === "reviews" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <Star size={18} />
            Đánh giá của tôi ({reviews.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "complaints" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("complaints")}
          >
            <MessageSquare size={18} />
            Khiếu nại ({complaints.length})
          </button>
        </div>
      )}

      {activeTab === "profile" && (
        <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.avatar}>
            <User size={32} />
          </div>
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{user.username}</h2>
            <p className={styles.userRole}>{user.role}</p>
          </div>
          {!editing && (
            <button
              className={styles.editButton}
              onClick={() => setEditing(true)}
            >
              <Edit size={16} />
              Chỉnh sửa
            </button>
          )}
        </div>

        <div className={styles.cardBody}>
          <div className={styles.formGroup}>
            <label>
              <User size={16} />
              Họ và tên
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            ) : (
              <p>{formData.fullName || "Chưa cập nhật"}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
              <Mail size={16} />
              Email
            </label>
            {editing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            ) : (
              <p>{formData.email || "Chưa cập nhật"}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
              <Phone size={16} />
              Số điện thoại
            </label>
            {editing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            ) : (
              <p>{formData.phone || "Chưa cập nhật"}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
              <MapPin size={16} />
              Địa chỉ
            </label>
            {editing ? (
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
              />
            ) : (
              <p>{formData.address || "Chưa cập nhật"}</p>
            )}
          </div>

          {editing && (
            <div className={styles.formActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                <X size={16} />
                Hủy
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={loading}
              >
                <Save size={16} />
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.sectionHeader}>
            <Lock size={20} />
            <h2 className={styles.sectionTitle}>Đổi mật khẩu</h2>
          </div>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => {
              setShowChangePassword(!showChangePassword);
              if (showChangePassword) {
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setPasswordErrors({});
              }
            }}
          >
            {showChangePassword ? "Ẩn" : "Hiện"}
          </button>
        </div>

        {showChangePassword && (
          <div className={styles.cardBody}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordErrors({});

                // Validation
                const errors: Record<string, string> = {};
                if (!passwordData.currentPassword.trim()) {
                  errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
                }
                if (!passwordData.newPassword.trim()) {
                  errors.newPassword = "Vui lòng nhập mật khẩu mới";
                } else if (passwordData.newPassword.length < 6) {
                  errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
                }
                if (!passwordData.confirmPassword.trim()) {
                  errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
                } else if (passwordData.newPassword !== passwordData.confirmPassword) {
                  errors.confirmPassword = "Mật khẩu xác nhận không khớp";
                }

                if (Object.keys(errors).length > 0) {
                  setPasswordErrors(errors);
                  return;
                }

                setChangingPassword(true);
                try {
                  await authApi.changePassword({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                  });
                  showToast("Đổi mật khẩu thành công", "success");
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setShowChangePassword(false);
                } catch (err: any) {
                  const errorMessage = err.message || "Không thể đổi mật khẩu. Vui lòng thử lại.";
                  if (errorMessage.includes("old password") || errorMessage.includes("mật khẩu hiện tại")) {
                    setPasswordErrors({ currentPassword: "Mật khẩu hiện tại không đúng" });
                  } else if (errorMessage.includes("token") || errorMessage.includes("expired")) {
                    showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
                    setTimeout(() => router.push("/login"), 2000);
                  } else {
                    showToast(errorMessage, "error");
                  }
                } finally {
                  setChangingPassword(false);
                }
              }}
            >
              <div className={styles.formGroup}>
                <label>
                  <Lock size={16} />
                  Mật khẩu hiện tại
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors({ ...passwordErrors, currentPassword: "" });
                      }
                    }}
                    className={passwordErrors.currentPassword ? styles.inputError : ""}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className={styles.passwordToggle}
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className={styles.errorText}>{passwordErrors.currentPassword}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <Lock size={16} />
                  Mật khẩu mới
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      if (passwordErrors.newPassword) {
                        setPasswordErrors({ ...passwordErrors, newPassword: "" });
                      }
                    }}
                    className={passwordErrors.newPassword ? styles.inputError : ""}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className={styles.passwordToggle}
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className={styles.errorText}>{passwordErrors.newPassword}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <Lock size={16} />
                  Xác nhận mật khẩu mới
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors({ ...passwordErrors, confirmPassword: "" });
                      }
                    }}
                    className={passwordErrors.confirmPassword ? styles.inputError : ""}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className={styles.passwordToggle}
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className={styles.errorText}>{passwordErrors.confirmPassword}</span>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setPasswordErrors({});
                  }}
                  disabled={changingPassword}
                >
                  <X size={16} />
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={changingPassword}
                >
                  <Lock size={16} />
                  {changingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      )}

      {activeTab === "reviews" && isCustomer && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Đánh giá của tôi</h2>
          {reviewsLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Đang tải đánh giá...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review.MaDanhGia} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <Link
                        href={`/product/${review.MaSP}`}
                        className={styles.productLink}
                      >
                        <h3>{review.TenSP}</h3>
                      </Link>
                      <div className={styles.reviewRating}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.DiemDanhGia ? "#fbbf24" : "none"}
                            color="#fbbf24"
                          />
                        ))}
                        <span>{review.DiemDanhGia}/5</span>
                      </div>
                      <p className={styles.reviewDate}>
                        {new Date(review.NgayDanhGia).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(review.MaDanhGia)}
                      className={styles.deleteButton}
                      title="Xóa đánh giá"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {review.NoiDung && (
                    <p className={styles.reviewContent}>{review.NoiDung}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Star size={48} />
              <p>Bạn chưa có đánh giá nào</p>
              <Link href="/shop" className={styles.shopButton}>
                Mua sắm ngay
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === "complaints" && isCustomer && (
        <div className={styles.card}>
          <div className={styles.complaintsHeader}>
            <h2 className={styles.sectionTitle}>Khiếu nại của tôi</h2>
            <Link href="/contact" className={styles.newComplaintButton}>
              <MessageSquare size={18} />
              Tạo khiếu nại mới
            </Link>
          </div>
          {complaintsLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Đang tải khiếu nại...</p>
            </div>
          ) : complaints.length > 0 ? (
            <div className={styles.complaintsList}>
              {complaints.map((complaint) => (
                <div key={complaint.MaKhieuNai} className={styles.complaintItem}>
                  <div className={styles.complaintHeader}>
                    <h3 className={styles.complaintTitle}>{complaint.TieuDe}</h3>
                    <span
                      className={`${styles.statusBadge} ${
                        complaint.TrangThai === "Resolved" || complaint.TrangThai === "Closed"
                          ? styles.statusResolved
                          : complaint.TrangThai === "Processing"
                          ? styles.statusProcessing
                          : styles.statusPending
                      }`}
                    >
                      {complaint.TrangThai}
                    </span>
                  </div>
                  <p className={styles.complaintContent}>{complaint.NoiDung}</p>
                  <div className={styles.complaintMeta}>
                    <span>
                      Ngày tạo: {new Date(complaint.NgayTao).toLocaleDateString("vi-VN")}
                    </span>
                    {complaint.PhanHoi && (
                      <div className={styles.complaintResponse}>
                        <strong>Phản hồi:</strong> {complaint.PhanHoi}
                        {complaint.TenNVPhanHoi && (
                          <span className={styles.responseBy}>
                            - {complaint.TenNVPhanHoi}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <MessageSquare size={48} />
              <p>Bạn chưa có khiếu nại nào</p>
              <Link href="/contact" className={styles.shopButton}>
                Tạo khiếu nại
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

