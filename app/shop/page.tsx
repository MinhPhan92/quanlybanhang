"use client"

import { useState, useEffect } from "react"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import ProductCard from "../components/home/product-card/product-card"
import { productsApi, categoriesApi, Product, Category } from "@/app/lib/api/products"
import styles from "@/app/shop/shop.module.css"

const sortOptions = [
  { value: "newest", label: "Mới Nhất" },
  { value: "priceLow", label: "Giá Thấp Đến Cao" },
  { value: "priceHigh", label: "Giá Cao Đến Thấp" },
  { value: "popular", label: "Phổ Biến" },
]

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [productsData, categoriesData] = await Promise.all([
        productsApi.getAll(1, 100, true).catch(() => ({ products: [], total: 0 })),
        categoriesApi.getAll().catch(() => []),
      ])
      setProducts(productsData.products || [])
      setCategories(categoriesData || [])
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu sản phẩm")
      console.error("Error loading products:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.MaDanhMuc === selectedCategory
    const matchesSearch = product.TenSP.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && !product.IsDelete
  })

  // Sort products
  const sortedProducts = [...filteredProducts]
  if (sortBy === "priceLow") {
    sortedProducts.sort((a, b) => a.GiaSP - b.GiaSP)
  } else if (sortBy === "priceHigh") {
    sortedProducts.sort((a, b) => b.GiaSP - a.GiaSP)
  } else if (sortBy === "popular") {
    sortedProducts.sort(() => Math.random() - 0.5)
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
              <button
                onClick={() => setSelectedCategory("all")}
                className={`${styles.categoryButton} ${selectedCategory === "all" ? styles.active : ""}`}
              >
                Tất Cả
              </button>
              {categories
                .filter((cat) => !cat.IsDelete)
                .map((category) => (
                  <button
                    key={category.MaDanhMuc}
                    onClick={() => setSelectedCategory(category.MaDanhMuc)}
                    className={`${styles.categoryButton} ${selectedCategory === category.MaDanhMuc ? styles.active : ""}`}
                  >
                    {category.TenDanhMuc}
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
            <span className={styles.resultCount}>
              Hiển thị {sortedProducts.length} sản phẩm
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Đang tải sản phẩm...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
              <button onClick={loadData} className={styles.resetButton}>
                Thử lại
              </button>
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {sortedProducts.map((product) => (
                <ProductCard key={product.MaSP} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>Không tìm thấy sản phẩm phù hợp</p>
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
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
