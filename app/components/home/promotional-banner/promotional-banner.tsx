"use client"

import { useRouter } from "next/navigation"
import styles from "./promotional-banner.module.css"

export default function PromotionalBanner() {
  const router = useRouter()

  const handleShopNow = () => {
    router.push("/shop")
  }

  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <div className={styles.badge}>Khuyến mãi đặc biệt</div>
          <h2 className={styles.title}>Giảm giá lên đến 30%</h2>
          <p className={styles.description}>
            Mua sắm ngay hôm nay và nhận ưu đãi đặc biệt cho tất cả sản phẩm
          </p>
          <button type="button" onClick={handleShopNow} className={styles.button}>
            Mua ngay
          </button>
        </div>
        <div className={styles.imageContainer}>
          <div className={styles.imagePlaceholder}></div>
        </div>
      </div>
    </section>
  )
}

