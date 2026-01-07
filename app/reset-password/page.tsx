"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { authApi } from "@/app/lib/api/auth"
import { Lock, CheckCircle, XCircle } from "lucide-react"
import styles from "./reset-password.module.css"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
      setError(null)
    } else {
      setError("Link đặt lại mật khẩu không hợp lệ. Vui lòng kiểm tra lại email hoặc yêu cầu link mới.")
    }
  }, [searchParams])

  useEffect(() => {
    // Calculate password strength
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    setPasswordStrength(strength)
  }, [password])

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return ""
    if (passwordStrength <= 2) return "Yếu"
    if (passwordStrength === 3) return "Trung bình"
    return "Mạnh"
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "#ef4444"
    if (passwordStrength === 3) return "#f59e0b"
    return "#10b981"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu mới")
      return
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    if (passwordStrength <= 2) {
      setError("Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn")
      return
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (!token) {
      setError("Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.")
      return
    }

    setLoading(true)

    try {
      await authApi.resetPassword(token, password)
      
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err: any) {
      const errorMessage = err.message || "Có lỗi xảy ra. Vui lòng thử lại."
      
      // Handle specific error cases
      if (errorMessage.includes("hết hạn") || errorMessage.includes("expired")) {
        setError("Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới từ trang quên mật khẩu.")
      } else if (errorMessage.includes("không hợp lệ") || errorMessage.includes("invalid")) {
        setError("Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu link mới.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.successCard}>
              <div className={styles.iconContainer}>
                <CheckCircle size={64} className={styles.successIcon} />
              </div>
              <h1 className={styles.title}>Đặt Lại Mật Khẩu Thành Công!</h1>
              <p className={styles.message}>
                Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển đến trang đăng nhập...
              </p>
              <Link href="/login" className={styles.loginButton}>
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Đặt Lại Mật Khẩu</h1>
            <p className={styles.subtitle}>Nhập mật khẩu mới của bạn</p>

            {error && (
              <div className={styles.errorContainer}>
                <XCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Mật khẩu mới
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} className={styles.inputIcon} />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className={styles.input}
                    required
                    minLength={8}
                  />
                </div>
                {password && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: getPasswordStrengthColor(),
                        }}
                      />
                    </div>
                    <span
                      className={styles.strengthLabel}
                      style={{ color: getPasswordStrengthColor() }}
                    >
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Xác nhận mật khẩu
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} className={styles.inputIcon} />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className={styles.input}
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className={styles.errorText}>Mật khẩu không khớp</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className={styles.successText}>✓ Mật khẩu khớp</p>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !token || password !== confirmPassword || password.length < 8 || passwordStrength <= 2}
              >
                {loading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
              </button>
            </form>

            <div className={styles.footer}>
              <Link href="/forgot-password" className={styles.backLink}>
                Yêu cầu link mới
              </Link>
              <span className={styles.separator}>|</span>
              <Link href="/login" className={styles.backLink}>
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

