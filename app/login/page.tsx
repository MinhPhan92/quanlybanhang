"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { authApi, LoginRequest, UserInfo } from "@/app/lib/api/auth";
import { useAuth } from "@/app/contexts/AuthContext";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      handleRedirect(user.role);
    }
  }, [isAuthenticated, user]);

  const handleRedirect = (role: string) => {
    if (role === "Admin" || role === "Manager") {
      router.push("/admin"); // Redirect to admin page (project management)
    } else {
      router.push("/"); // Redirect to home for other roles
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: Call login API
      const response = await authApi.login(formData);

      // Step 2: Save token to localStorage
      localStorage.setItem("token", response.token);

      // Step 3: Validate token by calling status API
      // This confirms backend recognizes the user role
      const statusResponse = await authApi.checkStatus();

      // Step 4: Extract user info from status response (validated by backend)
      const validatedUserInfo: UserInfo = {
        MaTK: statusResponse.user.MaTK,
        username: statusResponse.user.username,
        role: statusResponse.user.role,
        MaNV: statusResponse.user.MaNV,
        MaKH: statusResponse.user.MaKH,
      };

      // Step 5: Update context with validated user info
      login(response.token, validatedUserInfo);

      // Step 6: Redirect based on validated role
      handleRedirect(validatedUserInfo.role);
    } catch (err: any) {
      // If status check fails, clear token
      localStorage.removeItem("token");
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <LogIn size={32} />
          </div>
          <h1 className={styles.title}>Đăng nhập</h1>
          <p className={styles.subtitle}>Nhập thông tin để truy cập hệ thống</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nhập tên đăng nhập"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Mật khẩu
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Nhập mật khẩu"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className={styles.spinner} />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Chưa có tài khoản?{" "}
            <a href="/register" className={styles.link}>
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

