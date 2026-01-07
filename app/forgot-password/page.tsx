"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { authApi } from "@/app/lib/api/auth"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import styles from "./forgot-password.module.css"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email")
      setLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ")
      setLoading(false)
      return
    }

    try {
      const response = await authApi.forgotPassword(email.trim())
      
      // In development, if token is returned, show it for testing
      if (response.token && process.env.NODE_ENV === "development") {
        console.log("Reset token (dev only):", response.token)
        // Show token in alert for easy testing in development
        alert(`Development Mode: Reset token = ${response.token}\n\nYou can use this URL:\n/reset-password?token=${response.token}`)
      }
      
      setSubmitted(true)
    } catch (err: any) {
      const errorMessage = err.message || "Có lỗi xảy ra. Vui lòng thử lại."
      
      // Handle specific error cases
      if (errorMessage.includes("không tồn tại") || errorMessage.includes("not found")) {
        // Don't reveal if email exists (security best practice)
        setSubmitted(true) // Show success message anyway
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.successCard}>
              <div className={styles.iconContainer}>
                <CheckCircle size={64} className={styles.successIcon} />
              </div>
              <h1 className={styles.title}>Email đã được gửi!</h1>
              <p className={styles.message}>
                Chúng tôi đã gửi link đặt lại mật khẩu đến địa chỉ email <strong>{email}</strong>
              </p>
              <p className={styles.instruction}>
                Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn trong email để đặt lại mật khẩu.
              </p>
              <div className={styles.actions}>
                <Link href="/login" className={styles.backButton}>
                  <ArrowLeft size={20} />
                  Quay lại đăng nhập
                </Link>
              </div>
              <div className={styles.helpText}>
                <p>Không nhận được email?</p>
                <ul>
                  <li>Kiểm tra thư mục spam/junk</li>
                  <li>Đảm bảo email bạn nhập là chính xác</li>
                  <li>Thử lại sau vài phút</li>
                  <li>Nếu vẫn không nhận được, vui lòng liên hệ hỗ trợ</li>
                </ul>
                {process.env.NODE_ENV === "development" && (
                  <div className={styles.devNote}>
                    <p><strong>Development Mode:</strong> Check console for reset token</p>
                  </div>
                )}
              </div>
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
            <h1 className={styles.title}>Quên Mật Khẩu</h1>
            <p className={styles.subtitle}>
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi link để đặt lại mật khẩu
            </p>

            {error && (
              <div className={styles.errorContainer}>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Địa chỉ email
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={20} className={styles.inputIcon} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !email}
              >
                {loading ? "Đang gửi..." : "Gửi Link Đặt Lại Mật Khẩu"}
              </button>
            </form>

            <div className={styles.footer}>
              <Link href="/login" className={styles.backLink}>
                <ArrowLeft size={16} />
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

