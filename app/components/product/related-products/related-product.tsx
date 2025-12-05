"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import styles from "./related-products.module.css"
import { Heart } from "lucide-react"
import { productsApi, Product } from "@/app/lib/api/products"

interface RelatedProductsProps {
  currentProductId: number | null
}

export default function RelatedProducts({ currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRelatedProducts()
  }, [currentProductId])

  const loadRelatedProducts = async () => {
    try {
      setLoading(true)
      const data = await productsApi.getAll(1, 4, true)
      // Filter out current product and get 4 related products
      const related = (data.products || [])
        .filter((p) => !p.IsDelete && p.MaSP !== currentProductId)
        .slice(0, 4)
      setProducts(related)
    } catch (error) {
      console.error("Error loading related products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  if (loading) {
    return (
      <section className={styles.container}>
        <h2 className={styles.title}>Sản phẩm liên quan</h2>
        <div className={styles.loadingContainer}>
          <p>Đang tải...</p>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Sản phẩm liên quan</h2>
      <div className={styles.grid}>
        {products.map((product) => {
          // Parse attributes for image
          let attributes: Record<string, any> = {}
          if (product.MoTa) {
            try {
              attributes = JSON.parse(product.MoTa)
            } catch {
              // If not JSON, use as is
            }
          }
          const image = attributes.image || attributes.images?.[0] || "/placeholder.svg"

          return (
            <article key={product.MaSP} className={styles.card}>
              <Link href={`/product/${product.MaSP}`} className={styles.imageLink}>
                <div className={styles.imageWrapper}>
                  <img src={image} alt={product.TenSP} />
                  <button
                    className={styles.favoriteBtn}
                    aria-label="Thêm vào danh sách yêu thích"
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </Link>

              <div className={styles.content}>
                <Link href={`/product/${product.MaSP}`} className={styles.nameLink}>
                  <h3 className={styles.name}>{product.TenSP}</h3>
                </Link>

                <div className={styles.priceSection}>
                  <span className={styles.price}>{formatPrice(product.GiaSP || 0)}</span>
                </div>

                <button className={styles.addBtn}>Thêm vào giỏ</button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
