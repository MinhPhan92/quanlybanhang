"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"
import Link from "next/link"
import { User, Lock } from "lucide-react"
import styles from "./hero.module.css"

export default function Hero() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const handleShopNow = () => {
    router.push("/shop")
  }

  return (
    <section className={styles.hero}>
      <div className={styles.wrapper}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <h1 className={styles.title}>Đồ Gia Dụng Chất Lượng Cao</h1>
            <p className={styles.description}>
              Khám phá bộ sưu tập đồ gia dụng tiên tiến giúp biến căn nhà của bạn thành một không gian hiện đại, tiện
              nghi và đầy phong cách.
            </p>
            <div className={styles.buttonGroup}>
              <button type="button" onClick={handleShopNow} className={styles.button}>
                Mua sắm ngay
              </button>
              {isAuthenticated && (
                <Link href="/profile" className={styles.profileLink}>
                  <User size={18} />
                  <span>Thông tin cá nhân</span>
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                  <Lock size={18} />
                  <span>Quên mật khẩu?</span>
                </Link>
              )}
            </div>
          </div>
          <div className={styles.imageContainer}>
            <img src="/modern-kitchen-appliances.png" alt="Đồ gia dụng hiện đại" className={styles.image} />
          </div>
        </div>
      </div>
    </section>
  )
}
