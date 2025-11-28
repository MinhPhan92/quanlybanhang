"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Plus, Minus, ShoppingCart } from "lucide-react"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import styles from "./cart.module.css"

interface CartItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "Lò nướng thông minh",
      price: 5990000,
      image: "/smart-oven.png",
      quantity: 1,
    },
    {
      id: 2,
      name: "Máy giặt tự động",
      price: 8500000,
      image: "/automatic-washing-machine.jpg",
      quantity: 2,
    },
    {
      id: 3,
      name: "Tủ lạnh 2 cánh",
      price: 12500000,
      image: "/double-door-refrigerator.jpg",
      quantity: 1,
    },
  ])

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
    } else {
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 0 ? (subtotal >= 10000000 ? 0 : 100000) : 0
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + shipping + tax

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.emptyCart}>
              <ShoppingCart size={48} color="#ff8c42" />
              <h2 className={styles.emptyTitle}>Giỏ hàng của bạn trống</h2>
              <p className={styles.emptyText}>Hãy thêm một số sản phẩm để bắt đầu mua sắm</p>
              <Link href="/shop" className={styles.continueShoppingBtn}>
                Tiếp tục mua sắm
              </Link>
            </div>
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
          <h1 className={styles.title}>Giỏ hàng của bạn</h1>

          <div className={styles.content}>
            {/* Cart Items */}
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className={styles.itemImage} />

                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>{(item.price / 1000000).toFixed(1)}M đ</p>
                  </div>

                  <div className={styles.quantityControl}>
                    <button className={styles.quantityBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus size={16} />
                    </button>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <button className={styles.quantityBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className={styles.itemTotal}>{((item.price * item.quantity) / 1000000).toFixed(1)}M đ</div>

                  <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <aside className={styles.orderSummary}>
              <h2 className={styles.summaryTitle}>Tóm tắt đơn hàng</h2>

              <div className={styles.summaryRow}>
                <span>Tạm tính:</span>
                <span>{(subtotal / 1000000).toFixed(1)}M đ</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Phí vận chuyển:</span>
                <span>
                  {shipping === 0 ? (
                    <span className={styles.free}>Miễn phí</span>
                  ) : (
                    `${(shipping / 1000).toFixed(0)}k đ`
                  )}
                </span>
              </div>

              <div className={styles.summaryRow}>
                <span>Thuế:</span>
                <span>{(tax / 1000000).toFixed(1)}M đ</span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.totalRow}>
                <span>Tổng cộng:</span>
                <span className={styles.totalAmount}>{(total / 1000000).toFixed(1)}M đ</span>
              </div>

              <button className={styles.checkoutBtn}>Thanh toán</button>

              <Link href="/shop" className={styles.continueShoppingLink}>
                Tiếp tục mua sắm
              </Link>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
