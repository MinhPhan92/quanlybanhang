"use client"

import { useState, useEffect } from "react"
import ProductCard from "../product-card/product-card"
import ProductCardSkeleton from "@/app/components/shared/skeleton/ProductCardSkeleton"
import { productsApi, Product } from "@/app/lib/api/products"
import styles from "./new-products.module.css"

export default function NewProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productsApi.getAll(1, 8, true)
      const sorted = (data.products || [])
        .filter((p) => !p.IsDelete)
        .slice(0, 8) // Get newest products
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
          <h2 className={styles.title}>Sản Phẩm Mới</h2>
          <p className={styles.description}>
            Những sản phẩm mới nhất được thêm vào cửa hàng
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

