"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
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

    try {
      // TODO: Call API to send reset password email
      // await authApi.forgotPassword({ email })
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.")
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
                </ul>
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

