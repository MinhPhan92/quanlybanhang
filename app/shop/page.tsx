"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import ProductCard from "../components/home/product-card/product-card"
import { productsApi, categoriesApi, Product, Category, ProductFilters } from "@/app/lib/api/products"
import styles from "@/app/shop/shop.module.css"

const sortOptions = [
  { value: "newest", label: "Mới Nhất" },
  { value: "priceLow", label: "Giá Thấp Đến Cao" },
  { value: "priceHigh", label: "Giá Cao Đến Thấp" },
  { value: "popular", label: "Phổ Biến" },
]

export default function ShopPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [priceRange, setPriceRange] = useState<"under2" | "2to5" | "5to10" | "over10" | "all">("all")
  const [page] = useState(1)
  const [limit] = useState(100)

  // Đồng bộ state filter với query params trên URL (madanhmuc, search, priceRange)
  useEffect(() => {
    const madanhmucParam = searchParams.get("madanhmuc")
    const searchParam = searchParams.get("search") || ""
    const priceRangeParam = searchParams.get("priceRange") as
      | "under2"
      | "2to5"
      | "5to10"
      | "over10"
      | "all"
      | null

    if (madanhmucParam) {
      const parsed = Number(madanhmucParam)
      setSelectedCategory(!Number.isNaN(parsed) ? parsed : null)
    } else {
      setSelectedCategory(null)
    }

    setSearchTerm(searchParam)

    if (priceRangeParam && ["under2", "2to5", "5to10", "over10", "all"].includes(priceRangeParam)) {
      setPriceRange(priceRangeParam)
    } else {
      setPriceRange("all")
    }
  }, [searchParams])

  // Hàm đổi danh mục, chỉ cập nhật URL (không reload trang)
  const onCategoryChange = (madanhmuc: number | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (madanhmuc === null) {
      params.delete("madanhmuc")
    } else {
      params.set("madanhmuc", String(madanhmuc))
    }

    router.push(params.toString() ? `/shop?${params.toString()}` : "/shop")
  }

  // Hàm cập nhật search, giữ nguyên các filter khác
  const onSearchChange = (value: string) => {
    setSearchTerm(value)
    const params = new URLSearchParams(searchParams.toString())

    const trimmed = value.trim()
    if (trimmed) {
      params.set("search", trimmed)
    } else {
      params.delete("search")
    }

    router.push(params.toString() ? `/shop?${params.toString()}` : "/shop")
  }

  const buildFilters = (): ProductFilters => {
    const filters: ProductFilters = {}

    // Đọc madanhmuc trực tiếp từ URL (searchParams)
    const madanhmucParam = searchParams.get("madanhmuc")
    if (madanhmucParam) {
      const parsed = Number(madanhmucParam)
      if (!Number.isNaN(parsed)) {
        filters.madanhmuc = parsed
      }
    }

    // Đọc search từ URL
    const searchParam = searchParams.get("search")
    if (searchParam && searchParam.trim() !== "") {
      filters.search = searchParam.trim()
    }

    // Map khoảng giá UI -> min_price, max_price
    switch (priceRange) {
      case "under2":
        filters.min_price = 0
        filters.max_price = 2000000
        break
      case "2to5":
        filters.min_price = 2000000
        filters.max_price = 5000000
        break
      case "5to10":
        filters.min_price = 5000000
        filters.max_price = 10000000
        break
      case "over10":
        filters.min_price = 10000000
        break
      default:
        break
    }

    return filters
  }

  // Luôn gọi API khi URL (searchParams) hoặc khoảng giá thay đổi
  useEffect(() => {
    void loadData()
  }, [searchParams, priceRange])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const filters = buildFilters()
      const [productsData, categoriesData] = await Promise.all([
        productsApi.getAll(page, limit, true, filters).catch(() => ({ products: [], total: 0 })),
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

  const filteredProducts = products.filter((product) => !product.IsDelete)

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
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Categories Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Danh Mục</h3>
            <div className={styles.categoryList}>
              {categories
                .filter((cat) => !cat.IsDelete)
                .map((category) => (
                  <button
                    key={category.MaDanhMuc}
                    type="button"
                    onClick={() =>
                      onCategoryChange(
                        selectedCategory === category.MaDanhMuc ? null : category.MaDanhMuc,
                      )
                    }
                    className={`${styles.categoryButton} ${
                      selectedCategory === category.MaDanhMuc ? styles.categoryButtonActive : ""
                    }`}
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
                <input
                  type="radio"
                  name="priceRange"
                  checked={priceRange === "all"}
                  onChange={() => setPriceRange("all")}
                />
                <span>Tất cả</span>
              </label>
              <label className={styles.priceLabel}>
                <input
                  type="radio"
                  name="priceRange"
                  checked={priceRange === "under2"}
                  onChange={() => setPriceRange("under2")}
                />
                <span>Dưới 2 triệu</span>
              </label>
              <label className={styles.priceLabel}>
                <input
                  type="radio"
                  name="priceRange"
                  checked={priceRange === "2to5"}
                  onChange={() => setPriceRange("2to5")}
                />
                <span>2-5 triệu</span>
              </label>
              <label className={styles.priceLabel}>
                <input
                  type="radio"
                  name="priceRange"
                  checked={priceRange === "5to10"}
                  onChange={() => setPriceRange("5to10")}
                />
                <span>5-10 triệu</span>
              </label>
              <label className={styles.priceLabel}>
                <input
                  type="radio"
                  name="priceRange"
                  checked={priceRange === "over10"}
                  onChange={() => setPriceRange("over10")}
                />
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
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  router.push("/shop")
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
