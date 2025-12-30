"use client"

import { useState } from "react"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import styles from "./checkout.module.css"

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "card",
  })

  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e:any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e:any) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  const cartItems = [
    { id: 1, name: "Lò vi sóng thông minh", price: 2500000, quantity: 1, image: "/public/smart-microwave.jpg" },
    { id: 2, name: "Nồi áp suất điện", price: 1800000, quantity: 2, image: "/public/electric-pressure-cooker.jpg" },
  ]

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 10000000 ? 0 : 300000
  const tax = subtotal * 0.1
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
              {isSubmitted && (
                <div className={styles.successMessage}>
                  ✓ Đơn hàng đã được xác nhận! Chúng tôi sẽ liên hệ với bạn trong 24 giờ.
                </div>
              )}

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
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={styles.input}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Số điện thoại *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={styles.input}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Địa chỉ *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Số nhà, tên đường"
                      required
                    />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Thành phố *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={styles.input}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Mã bưu điện *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className={styles.input}
                        required
                      />
                    </div>
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
                        value="card"
                        checked={formData.paymentMethod === "card"}
                        onChange={handleChange}
                      />
                      <span>Thẻ tín dụng / Ghi nợ</span>
                    </label>
                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={formData.paymentMethod === "bank"}
                        onChange={handleChange}
                      />
                      <span>Chuyển khoản ngân hàng</span>
                    </label>
                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleChange}
                      />
                      <span>Thanh toán khi nhận hàng (COD)</span>
                    </label>
                  </div>
                </section>

                <button type="submit" className={styles.submitBtn}>
                  Xác Nhận Đơn Hàng
                </button>
              </form>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className={styles.orderSummary}>
              <h2 className={styles.summaryTitle}>Tóm Tắt Đơn Hàng</h2>

              <div className={styles.items}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
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
