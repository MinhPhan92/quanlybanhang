"use client";

// =====================================================
// 📦 ORDER PROCESSING FLOW - STEP 1: CART PAGE
// =====================================================
// Displays cart items and allows navigation to checkout.
// Flow:
// 1. Validates cart items on page load
// 2. Displays cart items with quantity controls
// 3. Calculates totals (subtotal, shipping, tax)
// 4. Navigates to checkout when user clicks "Thanh toán"
// =====================================================

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import Header from "../components/shared/header/Header";
import Footer from "../components/shared/footer/Footer";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import styles from "./cart.module.css";

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, validateCart, isLoading } =
    useCart();
  const { isAuthenticated } = useAuth();

  // ORDER FLOW STEP 1.1: Validate cart when page loads
  // Ensures cart items are still available and prices are current
  // This prevents checkout with invalid cart data
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCart();
    }
  }, []); // Only run once on mount

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const formattedPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const removeItem = (id: number) => {
    removeFromCart(id);
  };

  if (!isAuthenticated) {
    return null;
  }

  // ORDER FLOW STEP 1.2: Calculate cart totals
  // These calculations are also done in checkout page
  // Subtotal: sum of all item prices × quantities
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Shipping: free if subtotal >= 10,000,000 VND, else 100,000 VND
  const shipping = subtotal > 0 ? (subtotal >= 10000000 ? 0 : 100000) : 0;
  // Tax: 10% of subtotal
  const tax = Math.round(subtotal * 0.1);
  // Total: subtotal + shipping + tax (before discounts)
  const total = subtotal + shipping + tax;

  // ORDER FLOW STEP 1.3: Navigate to checkout
  // This transitions from cart to checkout page
  // Checkout page will use cart items to create order
  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL to checkout
      router.push("/login?redirect=/checkout");
    } else {
      // Go directly to checkout page
      router.push("/checkout");
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.emptyCart}>
              <ShoppingCart size={48} color="#ff8c42" />
              <h2 className={styles.emptyTitle}>Giỏ hàng của bạn trống</h2>
              <p className={styles.emptyText}>
                Hãy thêm một số sản phẩm để bắt đầu mua sắm
              </p>
              <Link href="/shop" className={styles.continueShoppingBtn}>
                Tiếp tục mua sắm
              </Link>
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
          <h1 className={styles.title}>Giỏ hàng của bạn</h1>

          <div className={styles.content}>
            {/* Cart Items */}
            <div className={styles.cartItems}>
              {cartItems.map((item) => {
                const isMaxStock = Boolean(
                  item.maxStock && item.quantity >= item.maxStock
                );

                return (
                  <div key={item.id} className={styles.cartItem}>
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className={styles.itemImage}
                    />

                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <p className={styles.itemPrice}>
                        {formattedPrice(item.price)}
                        {item.priceChanged && (
                          <span className={styles.priceChanged}>
                            {" "}
                            (Giá đã thay đổi)
                          </span>
                        )}
                      </p>
                      {item.maxStock && item.maxStock < 10 && (
                        <p className={styles.stockWarning}>
                          Chỉ còn {item.maxStock} sản phẩm
                        </p>
                      )}
                    </div>

                    <div className={styles.quantityControl}>
                      <button
                        className={styles.quantityBtn}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={isLoading}
                      >
                        <Minus size={16} />
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        className={styles.quantityBtn}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={isLoading || isMaxStock}
                        title={
                          isMaxStock ? `Tối đa ${item.maxStock} sản phẩm` : ""
                        }
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                    >
                      <X size={18} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <aside className={styles.orderSummary}>
              <h2 className={styles.summaryTitle}>Tóm tắt đơn hàng</h2>

              <div className={styles.summaryRow}>
                <span>Tạm tính:</span>
                <span>{formattedPrice(subtotal)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Phí vận chuyển:</span>
                <span>
                  {shipping === 0 ? (
                    <span className={styles.free}>Miễn phí</span>
                  ) : (
                    formattedPrice(shipping)
                  )}
                </span>
              </div>

              <div className={styles.summaryRow}>
                <span>Thuế:</span>
                <span>{formattedPrice(tax)}</span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.totalRow}>
                <span>Tổng cộng:</span>
                <span className={styles.totalAmount}>
                  {formattedPrice(total)}
                </span>
              </div>

              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                Thanh toán
              </button>

              <Link href="/shop" className={styles.continueShoppingLink}>
                Tiếp tục mua sắm
              </Link>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
