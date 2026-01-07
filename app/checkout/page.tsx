"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/shared/header/Header";
import Footer from "../components/shared/footer/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { ordersApi } from "@/app/lib/api/orders";
import { paymentsApi, CreateTransactionResponse } from "@/app/lib/api/payments";
import { Loader2, QrCode, CreditCard, Truck, Wallet } from "lucide-react";
import styles from "./checkout.module.css";

// =====================================================
// 📋 ORDER PROCESSING FLOW - STEP 2: CHECKOUT PAGE
// =====================================================
// This is where orders are created from cart items.
// Flow:
// 1. User fills shipping info and selects payment method
// 2. Calculates totals (subtotal, shipping, tax, discount)
// 3. Creates order via ordersApi.create() → backend/routes/donhang.py
// 4. If QR payment: creates payment transaction → backend/routes/mock_payment.py
// 5. Displays QR code or redirects to success page
// =====================================================

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "qr", // Default to QR payment
    discountPercentage: "", // Discount percentage input
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Payment state
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [transactionData, setTransactionData] =
    useState<CreateTransactionResponse | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  // Pre-fill user info if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || "",
        email: prev.email || "",
        phone: prev.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ORDER FLOW STEP 2.1: Calculate order totals
  // These calculations determine the final order amount
  // Subtotal: from cart items (price × quantity for each item)
  const subtotal = getTotalPrice();
  // Shipping: free if subtotal >= 10,000,000 VND, else 30,000 VND
  const shipping = subtotal >= 10000000 ? 0 : 30000;
  // Tax: 10% of subtotal
  const tax = subtotal * 0.1;
  // Original total before discount
  const originalTotal = subtotal + shipping + tax;
  
  // ORDER FLOW STEP 2.2: Calculate discount
  // Discount is applied as percentage to total (subtotal + shipping + tax)
  // Backend will recalculate and apply discount when creating order
  const discountPercentage = parseFloat(formData.discountPercentage) || 0;
  const discountAmount = discountPercentage > 0 && discountPercentage <= 100 
    ? (originalTotal * discountPercentage) / 100 
    : 0;
  
  // Final total after discount
  const total = originalTotal - discountAmount;

  // ORDER FLOW STEP 2.3: Submit checkout form and create order
  // This is the main order creation flow:
  // 1. Validates cart is not empty
  // 2. Prepares order data from cart items
  // 3. Calls ordersApi.create() → backend creates DonHang record
  // 4. If QR payment: creates payment transaction
  // 5. Clears cart and redirects to success page
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate cart is not empty before creating order
      if (cartItems.length === 0) {
        setError(
          "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán."
        );
        setIsSubmitting(false);
        return;
      }

      // ORDER FLOW STEP 2.4: Prepare order data from cart
      // This data will be sent to backend to create DonHang record
      // Items include price snapshot (DonGia) - price at order time
      // Backend will apply discount and calculate final total
      const orderData = {
        NgayDat: new Date().toISOString().split("T")[0], // Order date
        TongTien: originalTotal, // Original total before discount (backend will apply discount)
        TrangThai: "Chờ thanh toán", // Initial status: PENDING_PAYMENT
        MaKH: user?.MaKH, // Customer ID from authenticated user
        discount_percentage: discountPercentage > 0 ? discountPercentage : undefined, // Discount % to apply
        items: cartItems.map((item) => ({
          MaSP: item.id, // Product ID
          SoLuong: item.quantity, // Quantity ordered
          DonGia: item.price, // Price snapshot at order time (stored in DonHang_SanPham)
          GiamGia: 0, // Item-level discount (not used currently)
        })),
      };

      // ORDER FLOW STEP 2.5: Create order via API
      // This calls POST /api/donhang/ → backend/routes/donhang.py
      // Backend creates DonHang and DonHang_SanPham records
      const orderResponse = await ordersApi.create(orderData);
      const newOrderId = orderResponse.MaDonHang;
      setOrderId(newOrderId);

      // ORDER FLOW STEP 2.6: Handle payment based on selected method
      if (formData.paymentMethod === "qr") {
        // QR Payment: Create payment transaction
        // This calls POST /api/payment/create-transaction → backend/routes/mock_payment.py
        // Returns payment URL for QR code display
        const txnResponse = await paymentsApi.createTransaction(newOrderId);
        setTransactionData(txnResponse);
        setShowQRPayment(true); // Show QR code for payment
      } else if (formData.paymentMethod === "cod") {
        // COD (Cash on Delivery): No payment needed now
        // Order status remains "Chờ thanh toán" until delivery
        clearCart(); // Clear cart after successful order creation
        router.push(`/order/success?orderId=${newOrderId}`);
      } else {
        // Other payment methods: Redirect to success (mock)
        clearCart();
        router.push(`/order/success?orderId=${newOrderId}`);
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate QR code URL (using external QR API for simplicity)
  const getQRCodeUrl = (data: string) => {
    const fullUrl =
      typeof window !== "undefined" ? `${window.location.origin}${data}` : data;
    const encoded = encodeURIComponent(fullUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  };

  // Handle opening mock payment page
  const handleOpenMockPayment = () => {
    if (transactionData?.paymentUrl) {
      window.open(transactionData.paymentUrl, "_blank");
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Đang tải...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // QR Payment Modal/View
  if (showQRPayment && transactionData) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.qrPaymentSection}>
              <div className={styles.qrCard}>
                <div className={styles.qrHeader}>
                  <QrCode size={32} />
                  <h1>Thanh Toán QR</h1>
                </div>

                <div className={styles.qrContent}>
                  {/* QR Code */}
                  <div className={styles.qrCodeWrapper}>
                    <img
                      src={getQRCodeUrl(transactionData.paymentUrl)}
                      alt="QR Payment Code"
                      className={styles.qrImage}
                    />
                  </div>

                  {/* Transaction Info */}
                  <div className={styles.transactionInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Mã đơn hàng:</span>
                      <span className={styles.infoValue}>
                        #{transactionData.orderId}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Mã giao dịch:</span>
                      <span className={styles.infoValue}>
                        {transactionData.transactionId}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Số tiền:</span>
                      <span className={styles.infoValueAmount}>
                        {transactionData.amount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Trạng thái:</span>
                      <span className={styles.statusWaiting}>
                        Chờ thanh toán
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className={styles.instructions}>
                    <p>📱 Quét mã QR hoặc nhấn nút bên dưới để thanh toán</p>
                  </div>

                  {/* Actions */}
                  <div className={styles.qrActions}>
                    <button
                      onClick={handleOpenMockPayment}
                      className={styles.payNowBtn}
                    >
                      <Wallet size={20} />
                      Mở Trang Thanh Toán
                    </button>
                    <button
                      onClick={() => router.push(`/orders`)}
                      className={styles.viewOrderBtn}
                    >
                      Xem Đơn Hàng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Thanh Toán</h1>

          {error && <div className={styles.errorMessage}>⚠️ {error}</div>}

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
                      <label className={styles.label}>Mã bưu điện</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className={styles.input}
                      />
                    </div>
                  </div>
                </section>

                {/* Mã giảm giá */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Mã giảm giá</h2>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Phần trăm giảm giá (%)
                    </label>
                    <input
                      type="number"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleChange}
                      className={styles.input}
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Nhập phần trăm giảm giá (0-100)"
                    />
                    {discountPercentage > 0 && (
                      <p className={styles.discountInfo}>
                        Giảm: {discountAmount.toLocaleString("vi-VN")}₫ 
                        ({discountPercentage}%)
                      </p>
                    )}
                  </div>
                </section>

                {/* Phương thức thanh toán */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    Phương thức thanh toán
                  </h2>

                  <div className={styles.paymentMethods}>
                    <label
                      className={`${styles.paymentOption} ${
                        formData.paymentMethod === "qr" ? styles.selected : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="qr"
                        checked={formData.paymentMethod === "qr"}
                        onChange={handleChange}
                      />
                      <QrCode size={24} />
                      <div>
                        <span className={styles.paymentName}>
                          Thanh toán QR Code
                        </span>
                        <span className={styles.paymentDesc}>
                          Quét mã QR để thanh toán nhanh
                        </span>
                      </div>
                    </label>

                    <label
                      className={`${styles.paymentOption} ${
                        formData.paymentMethod === "card" ? styles.selected : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === "card"}
                        onChange={handleChange}
                      />
                      <CreditCard size={24} />
                      <div>
                        <span className={styles.paymentName}>
                          Thẻ tín dụng / Ghi nợ
                        </span>
                        <span className={styles.paymentDesc}>
                          Visa, Mastercard, JCB
                        </span>
                      </div>
                    </label>

                    <label
                      className={`${styles.paymentOption} ${
                        formData.paymentMethod === "cod" ? styles.selected : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleChange}
                      />
                      <Truck size={24} />
                      <div>
                        <span className={styles.paymentName}>
                          Thanh toán khi nhận hàng
                        </span>
                        <span className={styles.paymentDesc}>
                          COD - Cash on Delivery
                        </span>
                      </div>
                    </label>
                  </div>
                </section>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className={styles.btnSpinner} size={20} />
                      Đang xử lý...
                    </>
                  ) : (
                    "Tiến Hành Thanh Toán"
                  )}
                </button>
              </form>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className={styles.orderSummary}>
              <h2 className={styles.summaryTitle}>Tóm Tắt Đơn Hàng</h2>

              {cartItems.length === 0 ? (
                <p className={styles.emptyCart}>Giỏ hàng trống</p>
              ) : (
                <>
                  <div className={styles.items}>
                    {cartItems.map((item) => (
                      <div key={item.id} className={styles.summaryItem}>
                        <div className={styles.itemDetail}>
                          <p className={styles.itemName}>{item.name}</p>
                          <p className={styles.itemQty}>SL: {item.quantity}</p>
                        </div>
                        <p className={styles.itemPrice}>
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                          ₫
                        </p>
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
                      {shipping === 0
                        ? "Miễn phí"
                        : `${shipping.toLocaleString("vi-VN")}₫`}
                    </span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>Thuế (10%):</span>
                    <span>{tax.toLocaleString("vi-VN")}₫</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Giảm giá ({discountPercentage}%):</span>
                      <span className={styles.discountAmount}>
                        -{discountAmount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}

                  <div className={styles.divider}></div>

                  <div className={styles.totalRow}>
                    <span>Tổng cộng:</span>
                    <span className={styles.totalAmount}>
                      {total.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
