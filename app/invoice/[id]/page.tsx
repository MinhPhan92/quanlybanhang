"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { ordersApi, OrderDetail } from "@/app/lib/api/orders"
import { Download, Printer } from "lucide-react"
import jsPDF from "jspdf"
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const handleDownload = () => {
    if (!order) return

    try {
      const doc = new jsPDF()
      let yPos = 20

      // Company Info
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("Gia Dụng Plus", 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("123 Đường ABC, Hà Nội, Việt Nam", 20, yPos)
      yPos += 5
      doc.text("Điện thoại: 1900 1234", 20, yPos)
      yPos += 5
      doc.text("Email: support@giadung.vn", 20, yPos)
      yPos += 10

      // Invoice Title
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("HÓA ĐƠN BÁN HÀNG", 105, yPos, { align: "right" })
      yPos += 8

      // Invoice Details
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Mã đơn hàng: #${order.MaDonHang}`, 105, yPos, { align: "right" })
      yPos += 5
      doc.text(
        `Ngày đặt: ${new Date(order.NgayDat).toLocaleDateString("vi-VN")}`,
        105,
        yPos,
        { align: "right" }
      )
      yPos += 5
      doc.text(`Trạng thái: ${order.TrangThai}`, 105, yPos, { align: "right" })
      yPos += 15

      // Table Header
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("Sản phẩm", 20, yPos)
      doc.text("SL", 80, yPos)
      doc.text("Đơn giá", 100, yPos)
      doc.text("Giảm giá", 140, yPos)
      doc.text("Thành tiền", 170, yPos)
      yPos += 7

      // Draw line
      doc.setLineWidth(0.5)
      doc.line(20, yPos - 2, 190, yPos - 2)
      yPos += 3

      // Order Items
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      let subtotal = 0

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }

          const itemTotal = item.DonGia * item.SoLuong - (item.GiamGia || 0)
          subtotal += itemTotal

          // Product name (may need to wrap)
          const productName = item.TenSP.length > 25 ? item.TenSP.substring(0, 22) + "..." : item.TenSP
          doc.text(productName, 20, yPos)
          doc.text(item.SoLuong.toString(), 80, yPos)
          doc.text(formatCurrency(item.DonGia), 100, yPos)
          doc.text(item.GiamGia ? formatCurrency(item.GiamGia) : "-", 140, yPos)
          doc.text(formatCurrency(itemTotal), 170, yPos)
          yPos += 7
        })
      } else {
        doc.text("Không có sản phẩm", 20, yPos)
        yPos += 7
      }

      yPos += 5

      // Totals
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("Tạm tính:", 140, yPos)
      doc.text(formatCurrency(subtotal), 170, yPos, { align: "right" })
      yPos += 7

      if (order.PhiShip) {
        doc.text("Phí vận chuyển:", 140, yPos)
        doc.text(formatCurrency(order.PhiShip), 170, yPos, { align: "right" })
        yPos += 7
      }

      if (order.KhuyenMai) {
        doc.text(`Mã giảm giá (${order.KhuyenMai}):`, 140, yPos)
        doc.text("-", 170, yPos, { align: "right" })
        yPos += 7
      }

      // Total
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Tổng cộng:", 140, yPos)
      doc.text(formatCurrency(order.TongTien || 0), 170, yPos, { align: "right" })
      yPos += 15

      // Footer
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text("Cảm ơn bạn đã mua sắm tại Gia Dụng Plus!", 105, yPos, { align: "center" })
      yPos += 5
      doc.text("Hóa đơn này có giá trị pháp lý và được lưu trữ trong hệ thống.", 105, yPos, {
        align: "center",
      })

      // Save PDF
      doc.save(`HoaDon_${order.MaDonHang}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Không thể tạo file PDF. Vui lòng thử lại.")
    }
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

