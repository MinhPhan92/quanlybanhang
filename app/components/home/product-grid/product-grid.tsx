"use client"

import ProductCard from "../product-card/product-card"
import styles from "./product-grid.module.css"

const products = [
  {
    id: 1,
    name: "Lò Vi Sóng Thông Minh",
    price: 2500000,
    image: "/smart-microwave.jpg",
    category: "Nhà bếp",
  },
  {
    id: 2,
    name: "Nồi Áp Suất Điện",
    price: 1800000,
    image: "/electric-pressure-cooker.jpg",
    category: "Nhà bếp",
  },
  {
    id: 3,
    name: "Máy Hút Bụi Tự Động",
    price: 3200000,
    image: "/robotic-vacuum-cleaner.jpg",
    category: "Vệ sinh",
  },
  {
    id: 4,
    name: "Quạt Điều Hòa Thông Minh",
    price: 1200000,
    image: "/smart-air-fan.jpg",
    category: "Điều hòa",
  },
  {
    id: 5,
    name: "Bàn Ủi Hơi Nước",
    price: 950000,
    image: "/steam-iron.png",
    category: "Giặt ủi",
  },
  {
    id: 6,
    name: "Máy Rửa Chén Tự Động",
    price: 5500000,
    image: "/automatic-dishwasher.jpg",
    category: "Nhà bếp",
  },
  {
    id: 7,
    name: "Nôi Điện Thông Minh",
    price: 800000,
    image: "/smart-baby-crib.jpg",
    category: "Em bé",
  },
  {
    id: 8,
    name: "Máy Tạo Ẩm Không Khí",
    price: 1100000,
    image: "/air-humidifier.jpg",
    category: "Không khí",
  },
]

export default function ProductGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Sản Phẩm Nổi Bật</h2>
          <p className={styles.description}>Những sản phẩm được yêu thích nhất từ bộ sưu tập của chúng tôi</p>
        </div>

        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
