"use client"

import { useState, useEffect } from "react"
import ProductCard from "../product-card/product-card"
import { productsApi, Product } from "@/app/lib/api/products"
import styles from "./product-grid.module.css"

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productsApi.getAll(1, 8, true)
      setProducts((data.products || []).filter((p) => !p.IsDelete).slice(0, 8))
    } catch (error: any) {
      // Only log error if it's not a 404 (which is already logged in axios)
      if (!error.message?.includes("Không tìm thấy")) {
        console.error("Error loading products:", error)
      }
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Sản Phẩm Nổi Bật</h2>
          <p className={styles.description}>
            Những sản phẩm được yêu thích nhất từ bộ sưu tập của chúng tôi
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.MaSP} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <p>Chưa có sản phẩm nào</p>
          </div>
        )}
      </div>
    </section>
  )
}
