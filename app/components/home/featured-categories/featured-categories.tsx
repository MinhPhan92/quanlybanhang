"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { categoriesApi, Category } from "@/app/lib/api/products"
import styles from "./featured-categories.module.css"

export default function FeaturedCategories() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoriesApi.getAll()
      setCategories((data || []).filter((cat) => !cat.IsDelete).slice(0, 6))
    } catch (error: any) {
      console.warn("Could not load categories:", error?.message || "Unknown error")
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (madanhmuc: number) => {
    router.push(`/shop?madanhmuc=${madanhmuc}`)
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.wrapper}>
          <h2 className={styles.title}>Danh Mục Nổi Bật</h2>
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeleton}></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Danh Mục Nổi Bật</h2>
          <p className={styles.description}>
            Khám phá các danh mục sản phẩm được yêu thích nhất
          </p>
        </div>

        <div className={styles.grid}>
          {categories.map((category) => (
            <button
              key={category.MaDanhMuc}
              type="button"
              onClick={() => handleCategoryClick(category.MaDanhMuc)}
              className={styles.categoryCard}
            >
              <div className={styles.iconContainer}>
                <div className={styles.icon}>{category.TenDanhMuc[0]}</div>
              </div>
              <h3 className={styles.categoryName}>{category.TenDanhMuc}</h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

