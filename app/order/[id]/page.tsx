"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { useAuth } from "@/app/contexts/AuthContext"
import { ordersApi, OrderDetail } from "@/app/lib/api/orders"
import { Package, MapPin, CreditCard, Truck, Download, ArrowLeft } from "lucide-react"
import styles from "./order-detail.module.css"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const orderId = params?.id ? Number(params.id) : null
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (orderId && isAuthenticated) {
      loadOrder()
    }
  }, [orderId, isAuthenticated, isLoading, router])

  const loadOrder = async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError(null)
      const data = await ordersApi.getOne(orderId)
      setOrder(data)
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin đơn hàng")
      console.error("Error loading order:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      Pending: "#f59e0b",
      Confirmed: "#3b82f6",
      Processing: "#8b5cf6",
      Shipped: "#06b6d4",
      Delivered: "#10b981",
      Cancelled: "#ef4444",
      Returned: "#6b7280",
    }
    return statusMap[status] || "#6b7280"
  }

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      Pending: "Chờ xử lý",
      Confirmed: "Đã xác nhận",
      Processing: "Đang xử lý",
      Shipped: "Đang giao hàng",
      Delivered: "Đã giao hàng",
      Cancelled: "Đã hủy",
      Returned: "Đã trả hàng",
    }
    return labelMap[status] || status
  }

  if (isLoading || loading) {
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

  if (error || !order) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <p>{error || "Không tìm thấy đơn hàng"}</p>
            <Link href="/orders" className={styles.backButton}>
              <ArrowLeft size={20} />
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const formattedTotal = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(order.TongTien || 0)

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <Link href="/orders" className={styles.backLink}>
            <ArrowLeft size={20} />
            Quay lại danh sách đơn hàng
          </Link>

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Đơn Hàng #{order.MaDonHang}</h1>
              <p className={styles.date}>
                Đặt ngày: {new Date(order.NgayDat).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div
              className={styles.statusBadge}
              style={{ backgroundColor: `${getStatusColor(order.TrangThai)}20`, color: getStatusColor(order.TrangThai) }}
            >
              {getStatusLabel(order.TrangThai)}
            </div>
          </div>

          <div className={styles.content}>
            {/* Order Items */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Sản phẩm</h2>
              <div className={styles.itemsList}>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const itemTotal = (item.DonGia * item.SoLuong) - (item.GiamGia || 0)
                    return (
                      <div key={index} className={styles.itemCard}>
                        <div className={styles.itemInfo}>
                          <h3 className={styles.itemName}>{item.TenSP}</h3>
                          <p className={styles.itemDetails}>
                            Số lượng: {item.SoLuong} ×{" "}
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(item.DonGia)}
                          </p>
                          {item.GiamGia && item.GiamGia > 0 && (
                            <p className={styles.discount}>
                              Giảm giá:{" "}
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(item.GiamGia)}
                            </p>
                          )}
                        </div>
                        <div className={styles.itemTotal}>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(itemTotal)}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p>Không có sản phẩm</p>
                )}
              </div>
            </section>

            {/* Order Summary */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Tóm tắt đơn hàng</h2>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Tạm tính:</span>
                  <span>{formattedTotal}</span>
                </div>
                {order.PhiShip && (
                  <div className={styles.summaryRow}>
                    <span>Phí vận chuyển:</span>
                    <span>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.PhiShip)}
                    </span>
                  </div>
                )}
                {order.KhuyenMai && (
                  <div className={styles.summaryRow}>
                    <span>Mã giảm giá ({order.KhuyenMai}):</span>
                    <span className={styles.discount}>-</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Tổng cộng:</span>
                  <span className={styles.totalAmount}>{formattedTotal}</span>
                </div>
              </div>
            </section>

            {/* Shipping & Payment Info */}
            <div className={styles.infoGrid}>
              {order.shippingAddress && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    <MapPin size={20} />
                    Địa chỉ giao hàng
                  </h2>
                  <p className={styles.infoText}>{order.shippingAddress}</p>
                </section>
              )}

              {order.paymentMethod && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    <CreditCard size={20} />
                    Phương thức thanh toán
                  </h2>
                  <p className={styles.infoText}>{order.paymentMethod}</p>
                </section>
              )}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <Link href={`/track-order?orderId=${order.MaDonHang}`} className={styles.trackButton}>
                <Truck size={20} />
                Theo dõi đơn hàng
              </Link>
              <Link href={`/invoice/${order.MaDonHang}`} className={styles.invoiceButton}>
                <Download size={20} />
                Tải hóa đơn
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

