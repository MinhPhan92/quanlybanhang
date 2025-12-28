"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { XCircle, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import styles from "./failed.module.css"

export default function PaymentFailedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string>("Thanh toán không thành công")

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      setErrorMessage(decodeURIComponent(error))
    }
  }, [searchParams])

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.failedCard}>
            <div className={styles.iconContainer}>
              <XCircle size={64} className={styles.errorIcon} />
            </div>

            <h1 className={styles.title}>Thanh Toán Thất Bại</h1>
            <p className={styles.message}>{errorMessage}</p>

            <div className={styles.errorDetails}>
              <div className={styles.errorItem}>
                <AlertCircle size={20} />
                <span>Giao dịch không được xử lý</span>
              </div>
              <div className={styles.errorItem}>
                <AlertCircle size={20} />
                <span>Đơn hàng chưa được tạo</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                onClick={() => router.back()}
                className={styles.retryButton}
              >
                <RefreshCw size={20} />
                Thử Lại
              </button>
              <Link href="/cart" className={styles.cartButton}>
                <ArrowLeft size={20} />
                Về Giỏ Hàng
              </Link>
              <Link href="/" className={styles.homeButton}>
                Về Trang Chủ
              </Link>
            </div>

            <div className={styles.helpSection}>
              <h2 className={styles.helpTitle}>Cần hỗ trợ?</h2>
              <p className={styles.helpText}>
                Nếu bạn gặp vấn đề với thanh toán, vui lòng liên hệ với chúng tôi:
              </p>
              <div className={styles.contactInfo}>
                <p>📞 Hotline: 1900 1234</p>
                <p>✉️ Email: support@giadung.vn</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

