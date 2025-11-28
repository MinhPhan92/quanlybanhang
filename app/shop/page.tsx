"use client"

import { useState } from "react"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import ProductCard from "../components/home/product-card/product-card"
import styles from "@/app/shop/shop.module.css"

const allProducts = [
  { id: 1, name: "Lò Nướng Thông Minh", price: 2500000, image: "/smart-oven.png", category: "Nướng" },
  { id: 2, name: "Máy Giặt Tự Động", price: 8500000, image: "/automatic-washing-machine.jpg", category: "Giặt Sấy" },
  { id: 3, name: "Tủ Lạnh Kép", price: 15000000, image: "/double-door-refrigerator.jpg", category: "Lạnh" },
  { id: 4, name: "Nồi Cơm Điện Tử", price: 1200000, image: "/rice-cooker.png", category: "Nấu Ăn" },
  { id: 5, name: "Máy Rửa Chén", price: 12000000, image: "/modern-dishwasher.png", category: "Rửa" },
  { id: 6, name: "Máy Sấy Quần Áo", price: 6500000, image: "/clothes-dryer.jpg", category: "Giặt Sấy" },
  { id: 7, name: "Bếp Từ Cảm Ứng", price: 3500000, image: "/induction-cooktop.jpg", category: "Nấu Ăn" },
  { id: 8, name: "Quạt Hơi Nước", price: 2800000, image: "/misting-fan.jpg", category: "Làm Mát" },
  { id: 9, name: "Máy Hút Bụi Điện", price: 4500000, image: "/classic-vacuum-cleaner.png", category: "Vệ Sinh" },
  { id: 10, name: "Lò Vi Sóng Hiện Đại", price: 3200000, image: "/microwave-oven.png", category: "Nấu Ăn" },
  {
    id: 11,
    name: "Máy Giặt Lồng Ngang",
    price: 7500000,
    image: "/front-load-washing-machine.jpg",
    category: "Giặt Sấy",
  },
  { id: 12, name: "Tủ Cơm Điện", price: 1800000, image: "/electric-cooker.jpg", category: "Nấu Ăn" },
]

const categories = ["Tất Cả", "Nấu Ăn", "Giặt Sấy", "Lạnh", "Nướng", "Rửa", "Làm Mát", "Vệ Sinh"]
const sortOptions = [
  { value: "newest", label: "Mới Nhất" },
  { value: "priceLow", label: "Giá Thấp Đến Cao" },
  { value: "priceHigh", label: "Giá Cao Đến Thấp" },
  { value: "popular", label: "Phổ Biến" },
]

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tất Cả")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = selectedCategory === "Tất Cả" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Sort products
  if (sortBy === "priceLow") {
    filteredProducts.sort((a, b) => a.price - b.price)
  } else if (sortBy === "priceHigh") {
    filteredProducts.sort((a, b) => b.price - a.price)
  } else if (sortBy === "popular") {
    filteredProducts.sort(() => Math.random() - 0.5)
  }

  return (
    <div className={styles.container}>
      <Header />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Cửa Hàng Sản Phẩm</h1>
          <p className={styles.heroSubtitle}>Khám phá bộ sưu tập đồ gia dụng chất lượng cao</p>
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Search Bar */}
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Categories Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Danh Mục</h3>
            <div className={styles.categoryList}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ""}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Khoảng Giá</h3>
            <div className={styles.priceRanges}>
              <label className={styles.priceLabel}>
                <input type="checkbox" defaultChecked />
                <span>Dưới 2 triệu</span>
              </label>
              <label className={styles.priceLabel}>
                <input type="checkbox" />
                <span>2-5 triệu</span>
              </label>
              <label className={styles.priceLabel}>
                <input type="checkbox" />
                <span>5-10 triệu</span>
              </label>
              <label className={styles.priceLabel}>
                <input type="checkbox" />
                <span>Trên 10 triệu</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products Section */}
        <section className={styles.productsSection}>
          {/* Sort Bar */}
          <div className={styles.sortBar}>
            <span className={styles.resultCount}>Hiển thị {filteredProducts.length} sản phẩm</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>Không tìm thấy sản phẩm phù hợp</p>
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("Tất Cả")
                }}
                className={styles.resetButton}
              >
                Đặt Lại Bộ Lọc
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}
