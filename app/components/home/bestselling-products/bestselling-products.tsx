"use client"

import { useState, useEffect } from "react"
import ProductCard from "../product-card/product-card"
import ProductCardSkeleton from "@/app/components/shared/skeleton/ProductCardSkeleton"
import { productsApi, Product } from "@/app/lib/api/products"
import styles from "./bestselling-products.module.css"

export default function BestsellingProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // Get products and sort by some criteria (could be by sales count if available)
      const data = await productsApi.getAll(1, 8, true)
      const sorted = (data.products || [])
        .filter((p) => !p.IsDelete)
        .sort(() => Math.random() - 0.5) // Random for now, should sort by actual sales
        .slice(0, 8)
      setProducts(sorted)
    } catch (error: any) {
      console.warn("Could not load products:", error?.message || "Unknown error")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Sản Phẩm Bán Chạy</h2>
          <p className={styles.description}>
            Những sản phẩm được khách hàng yêu thích và mua nhiều nhất
          </p>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.MaSP} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

