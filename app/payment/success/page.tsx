"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { CheckCircle, CreditCard, ArrowRight } from "lucide-react"
import styles from "./success.module.css"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)

  useEffect(() => {
    const txId = searchParams.get("transactionId")
    const ordId = searchParams.get("orderId")
    const amt = searchParams.get("amount")

    if (txId) setTransactionId(txId)
    if (ordId) setOrderId(ordId)
    if (amt) setAmount(parseFloat(amt))
  }, [searchParams])

  const formattedAmount = amount
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount)
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

            <h1 className={styles.title}>Thanh Toán Thành Công!</h1>
            <p className={styles.message}>
              Giao dịch của bạn đã được xử lý thành công. Đơn hàng đang được chuẩn bị.
            </p>

            <div className={styles.paymentInfo}>
              {transactionId && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Mã giao dịch:</span>
                  <span className={styles.value}>{transactionId}</span>
                </div>
              )}
              {orderId && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Mã đơn hàng:</span>
                  <span className={styles.value}>#{orderId}</span>
                </div>
              )}
              {amount && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Số tiền:</span>
                  <span className={styles.value}>{formattedAmount}</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.label}>Phương thức:</span>
                <span className={styles.value}>Thẻ tín dụng / Ghi nợ</span>
              </div>
            </div>

            <div className={styles.actions}>
              {orderId && (
                <Link href={`/order/success?orderId=${orderId}`} className={styles.primaryButton}>
                  Xem Đơn Hàng
                  <ArrowRight size={20} />
                </Link>
              )}
              <Link href="/" className={styles.secondaryButton}>
                Về Trang Chủ
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

