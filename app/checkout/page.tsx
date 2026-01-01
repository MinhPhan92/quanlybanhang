"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { ordersApi } from "../lib/api/orders"
import styles from "./checkout.module.css"

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { showToast } = useToast()
  const hasRedirected = useRef(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Prevent multiple redirects and toasts
    if (hasRedirected.current) return

    if (!isAuthenticated) {
      hasRedirected.current = true
      showToast("Vui lòng đăng nhập để thanh toán", "warning")
      router.push("/login")
      return
    }

    if (cartItems.length === 0) {
      hasRedirected.current = true
      showToast("Giỏ hàng của bạn trống", "warning")
      router.push("/cart")
      return
    }
  }, [isAuthenticated, cartItems.length, router, showToast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại"
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    setIsSubmitting(true)

    try {
      const subtotal = getTotalPrice()
      const shipping = subtotal >= 10000000 ? 0 : 100000
      const tax = Math.round(subtotal * 0.1)
      const total = subtotal + shipping + tax

      // Prepare order items from cart
      const orderItems = cartItems.map((item) => ({
        MaSP: item.id, // Use item.id instead of item.MaSP
        SoLuong: item.quantity, // Use item.quantity instead of item.SoLuong
        DonGia: item.price, // Use item.price instead of item.GiaSP
        GiamGia: 0, // Default discount to 0 (can be extended later)
      }))

      const orderData = {
        NgayDat: new Date().toISOString(),
        TongTien: total,
        TrangThai: "Pending",
        MaKH: user?.MaKH,
        PhiShip: shipping, // Include shipping fee
        items: orderItems, // Include cart items
      }

      const response = await ordersApi.create(orderData)
      showToast("Đơn hàng đã được tạo thành công!", "success")
      clearCart()
      setTimeout(() => {
        router.push(`/profile/orders`)
      }, 1500)
    } catch (error: any) {
      showToast(error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.", "error")
      console.error("Error creating order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated || cartItems.length === 0) {
    return null
  }

  const subtotal = getTotalPrice()
  const shipping = subtotal >= 10000000 ? 0 : 100000
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + shipping + tax

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Thanh Toán</h1>

          <div className={styles.content}>
            {/* Form */}
            <div className={styles.formSection}>
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Thông tin giao hàng */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Thông tin giao hàng</h2>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Họ và tên *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
                      placeholder="Nhập họ và tên"
                      required
                    />
                    {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số điện thoại *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                    {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Địa chỉ *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.address ? styles.inputError : ""}`}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      required
                    />
                    {errors.address && <span className={styles.errorText}>{errors.address}</span>}
                  </div>
                </section>

                {/* Phương thức thanh toán */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Phương thức thanh toán</h2>

                  <div className={styles.paymentMethods}>
                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Thanh toán khi nhận hàng (COD)</span>
                    </label>
                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === "bank"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Chuyển khoản ngân hàng</span>
                    </label>
                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Thẻ tín dụng / Ghi nợ</span>
                    </label>
                  </div>
                </section>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Đang xử lý..." : "Xác Nhận Đơn Hàng"}
                </button>
              </form>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className={styles.orderSummary}>
              <h2 className={styles.summaryTitle}>Tóm Tắt Đơn Hàng</h2>

              <div className={styles.items}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.itemImageContainer}>
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className={styles.itemImage}
                      />
                    </div>
                    <div className={styles.itemDetail}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemQty}>SL: {item.quantity}</p>
                    </div>
                    <p className={styles.itemPrice}>{(item.price * item.quantity).toLocaleString("vi-VN")}₫</p>
                  </div>
                ))}
              </div>

              <div className={styles.divider}></div>

              <div className={styles.summaryRow}>
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Vận chuyển:</span>
                <span className={shipping === 0 ? styles.free : ""}>
                  {shipping === 0 ? "Miễn phí" : `${shipping.toLocaleString("vi-VN")}₫`}
                </span>
              </div>

              <div className={styles.summaryRow}>
                <span>Thuế (10%):</span>
                <span>{tax.toLocaleString("vi-VN")}₫</span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.totalRow}>
                <span>Tổng cộng:</span>
                <span className={styles.totalAmount}>{total.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
