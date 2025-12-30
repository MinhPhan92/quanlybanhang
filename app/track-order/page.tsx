"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { useAuth } from "@/app/contexts/AuthContext"
import { ordersApi, OrderDetail } from "@/app/lib/api/orders"
import { Package, Search, CheckCircle, Clock, Truck, Home } from "lucide-react"
import styles from "./track-order.module.css"

export default function TrackOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [orderId, setOrderId] = useState<string>("")
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get("orderId")
    if (id) {
      setOrderId(id)
      if (isAuthenticated) {
        loadOrder(Number(id))
      }
    }
  }, [searchParams, isAuthenticated])

  const loadOrder = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ordersApi.getOne(id)
      setOrder(data)
    } catch (err: any) {
      setError(err.message || "Không tìm thấy đơn hàng")
      console.error("Error loading order:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderId && isAuthenticated) {
      loadOrder(Number(orderId))
    } else if (!isAuthenticated) {
      router.push("/login")
    }
  }

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: "Pending", label: "Chờ xử lý", icon: Clock },
      { key: "Confirmed", label: "Đã xác nhận", icon: CheckCircle },
      { key: "Processing", label: "Đang xử lý", icon: Package },
      { key: "Shipped", label: "Đang giao hàng", icon: Truck },
      { key: "Delivered", label: "Đã giao hàng", icon: Home },
    ]

    const statusOrder = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"]
    const currentIndex = statusOrder.indexOf(status)

    return steps.map((step, index) => {
      const stepIndex = statusOrder.indexOf(step.key)
      const isActive = stepIndex <= currentIndex
      const isCurrent = stepIndex === currentIndex

      return {
        ...step,
        isActive,
        isCurrent,
      }
    })
  }

  if (authLoading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <p>Đang tải...</p>
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
          <h1 className={styles.title}>Theo Dõi Đơn Hàng</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchBox}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Nhập mã đơn hàng..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button type="submit" className={styles.searchButton} disabled={loading}>
              {loading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </form>

          {/* Order Tracking */}
          {error && (
            <div className={styles.errorContainer}>
              <p>{error}</p>
            </div>
          )}

          {order && (
            <div className={styles.trackingCard}>
              <div className={styles.orderHeader}>
                <h2 className={styles.orderTitle}>Đơn hàng #{order.MaDonHang}</h2>
                <p className={styles.orderDate}>
                  Đặt ngày: {new Date(order.NgayDat).toLocaleDateString("vi-VN")}
                </p>
              </div>

              {/* Status Timeline */}
              <div className={styles.timeline}>
                {getStatusSteps(order.TrangThai).map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.key} className={styles.timelineStep}>
                      <div
                        className={`${styles.stepIcon} ${step.isActive ? styles.active : ""} ${step.isCurrent ? styles.current : ""}`}
                      >
                        <Icon size={24} />
                      </div>
                      <div className={styles.stepContent}>
                        <h3 className={styles.stepTitle}>{step.label}</h3>
                        {step.isCurrent && (
                          <p className={styles.stepStatus}>Trạng thái hiện tại</p>
                        )}
                      </div>
                      {index < getStatusSteps(order.TrangThai).length - 1 && (
                        <div
                          className={`${styles.timelineLine} ${step.isActive ? styles.active : ""}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Order Summary */}
              <div className={styles.summary}>
                <h3 className={styles.summaryTitle}>Tóm tắt đơn hàng</h3>
                <div className={styles.summaryRow}>
                  <span>Tổng tiền:</span>
                  <span className={styles.totalAmount}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(order.TongTien || 0)}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Trạng thái:</span>
                  <span className={styles.status}>{order.TrangThai}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <a href={`/order/${order.MaDonHang}`} className={styles.detailButton}>
                  Xem chi tiết đơn hàng
                </a>
              </div>
            </div>
          )}

          {!order && !error && !loading && (
            <div className={styles.emptyState}>
              <Package size={48} color="#9ca3af" />
              <p>Nhập mã đơn hàng để theo dõi</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

