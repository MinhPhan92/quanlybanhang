// =====================================================
// 📋 ORDER PROCESSING FLOW - STEP 7: ORDER SUCCESS PAGE
// =====================================================
// Displays order confirmation after successful order creation.
// This page is shown after:
// 1. Order is created in checkout
// 2. Payment is completed (for COD or other non-QR methods)
// 3. User is redirected here with orderId parameter
// Flow:
// 1. Displays order confirmation message
// 2. Shows order ID and total
// 3. Provides links to view order details and download invoice
// =====================================================

"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { CheckCircle, Package, Download, Home } from "lucide-react"
import styles from "./success.module.css"

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState<number | null>(null)

  useEffect(() => {
    const id = searchParams.get("orderId")
    const total = searchParams.get("total")
    if (id) {
      setOrderId(id)
      if (total) {
        setOrderTotal(parseFloat(total))
      }
    } else {
      // If no order ID, redirect to home after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    }
  }, [searchParams, router])

  const formattedTotal = orderTotal
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(orderTotal)
    : ""

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.iconContainer}>
              <CheckCircle size={64} className={styles.successIcon} />
            </div>

            <h1 className={styles.title}>Đặt Hàng Thành Công!</h1>
            <p className={styles.message}>
              Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
            </p>

            {orderId && (
              <div className={styles.orderInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Mã đơn hàng:</span>
                  <span className={styles.value}>#{orderId}</span>
                </div>
                {orderTotal && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Tổng tiền:</span>
                    <span className={styles.value}>{formattedTotal}</span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.label}>Trạng thái:</span>
                  <span className={styles.status}>Đang xử lý</span>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Link href={`/order/${orderId || ""}`} className={styles.primaryButton}>
                <Package size={20} />
                Xem Chi Tiết Đơn Hàng
              </Link>
              <Link href={`/invoice/${orderId || ""}`} className={styles.secondaryButton}>
                <Download size={20} />
                Tải Hóa Đơn
              </Link>
              <Link href="/" className={styles.homeButton}>
                <Home size={20} />
                Về Trang Chủ
              </Link>
            </div>

            <div className={styles.nextSteps}>
              <h2 className={styles.nextStepsTitle}>Bước tiếp theo</h2>
              <ul className={styles.stepsList}>
                <li>Chúng tôi sẽ gửi email xác nhận đơn hàng đến địa chỉ email của bạn</li>
                <li>Bạn có thể theo dõi đơn hàng tại trang "Đơn hàng của tôi"</li>
                <li>Dự kiến giao hàng trong 2-3 ngày làm việc</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

