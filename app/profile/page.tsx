"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react";
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Thông tin cá nhân</h1>
        <p className={styles.subtitle}>Quản lý thông tin tài khoản của bạn</p>
      </div>

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
    </div>
  );
}

