"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/app/lib/api/auth";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    fullName: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError("Vui lòng nhập tên đăng nhập");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Vui lòng nhập email");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email không hợp lệ");
      return false;
    }

    if (!formData.fullName.trim()) {
      setError("Vui lòng nhập họ và tên");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Vui lòng nhập địa chỉ");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });
      
      // Registration successful, redirect to login
      router.push("/login?registered=true");
    } catch (err: any) {
      const errorMessage = err.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Đăng ký tài khoản</h1>
        <p className={styles.subtitle}>Tạo tài khoản mới để bắt đầu mua sắm</p>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Tên đăng nhập *</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="Nhập email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="fullName">Họ và tên *</label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
              placeholder="Nhập họ và tên"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Số điện thoại *</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address">Địa chỉ *</label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Mật khẩu *</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              minLength={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p className={styles.loginLink}>
          Đã có tài khoản? <Link href="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}

