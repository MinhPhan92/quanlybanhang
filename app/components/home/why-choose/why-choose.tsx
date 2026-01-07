"use client"

import { Shield, Truck, Headphones, Award } from "lucide-react"
import styles from "./why-choose.module.css"

const features = [
  {
    icon: Shield,
    title: "Chất lượng đảm bảo",
    description: "Tất cả sản phẩm đều được kiểm tra kỹ lưỡng trước khi giao hàng",
  },
  {
    icon: Truck,
    title: "Giao hàng nhanh chóng",
    description: "Miễn phí vận chuyển cho đơn hàng trên 10 triệu, giao trong 2-3 ngày",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc",
  },
  {
    icon: Award,
    title: "Bảo hành chính hãng",
    description: "Tất cả sản phẩm đều có bảo hành chính hãng từ nhà sản xuất",
  },
]

export default function WhyChoose() {
  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tại sao chọn Gia Dụng Plus?</h2>
          <p className={styles.description}>
            Chúng tôi cam kết mang đến cho bạn trải nghiệm mua sắm tốt nhất
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className={styles.featureCard}>
                <div className={styles.iconContainer}>
                  <Icon size={32} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

