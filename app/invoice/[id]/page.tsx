"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { ordersApi, OrderDetail } from "@/app/lib/api/orders"
import { Download, Printer } from "lucide-react"
import styles from "./invoice.module.css"

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id ? Number(params.id) : null
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError(null)
      const data = await ordersApi.getOne(orderId)
      setOrder(data)
    } catch (err: any) {
      setError(err.message || "Không thể tải hóa đơn")
      console.error("Error loading invoice:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implement PDF download
    alert("Tính năng tải PDF sẽ được triển khai sớm")
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <p>Đang tải hóa đơn...</p>
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
            <p>{error || "Không tìm thấy hóa đơn"}</p>
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
          <div className={styles.invoice}>
            {/* Header Actions - Hidden when printing */}
            <div className={styles.actions}>
              <button onClick={handlePrint} className={styles.printButton}>
                <Printer size={20} />
                In Hóa Đơn
              </button>
              <button onClick={handleDownload} className={styles.downloadButton}>
                <Download size={20} />
                Tải PDF
              </button>
            </div>

            {/* Invoice Header */}
            <div className={styles.header}>
              <div className={styles.companyInfo}>
                <h1 className={styles.companyName}>Gia Dụng Plus</h1>
                <p>123 Đường ABC, Hà Nội, Việt Nam</p>
                <p>Điện thoại: 1900 1234</p>
                <p>Email: support@giadung.vn</p>
              </div>
              <div className={styles.invoiceInfo}>
                <h2 className={styles.invoiceTitle}>HÓA ĐƠN BÁN HÀNG</h2>
                <div className={styles.invoiceDetails}>
                  <p>
                    <span className={styles.label}>Mã đơn hàng:</span> #{order.MaDonHang}
                  </p>
                  <p>
                    <span className={styles.label}>Ngày đặt:</span>{" "}
                    {new Date(order.NgayDat).toLocaleDateString("vi-VN")}
                  </p>
                  <p>
                    <span className={styles.label}>Trạng thái:</span> {order.TrangThai}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className={styles.itemsSection}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Giảm giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => {
                      const itemTotal = (item.DonGia * item.SoLuong) - (item.GiamGia || 0)
                      return (
                        <tr key={index}>
                          <td>{item.TenSP}</td>
                          <td>{item.SoLuong}</td>
                          <td>
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(item.DonGia)}
                          </td>
                          <td>
                            {item.GiamGia
                              ? new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(item.GiamGia)
                              : "-"}
                          </td>
                          <td>
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(itemTotal)}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.noItems}>
                        Không có sản phẩm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className={styles.totalsSection}>
              <div className={styles.totalsRow}>
                <span>Tạm tính:</span>
                <span>{formattedTotal}</span>
              </div>
              {order.PhiShip && (
                <div className={styles.totalsRow}>
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
                <div className={styles.totalsRow}>
                  <span>Mã giảm giá ({order.KhuyenMai}):</span>
                  <span className={styles.discount}>-</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Tổng cộng:</span>
                <span className={styles.totalAmount}>{formattedTotal}</span>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <p>Cảm ơn bạn đã mua sắm tại Gia Dụng Plus!</p>
              <p>Hóa đơn này có giá trị pháp lý và được lưu trữ trong hệ thống.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

