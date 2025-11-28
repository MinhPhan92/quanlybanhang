"use client"

import { Heart, ShoppingCart } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import styles from "./product-card.module.css"

interface ProductCardProps {
  product: {
    id: number
    name: string
    price: number
    image: string
    category: string
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(product.price)

  return (
    <Link href={`/product/${product.id}`}>
      <div className={styles.card}>
        {/* Image Container */}
        <div className={styles.imageContainer}>
          <img src={product.image || "/placeholder.svg"} alt={product.name} className={styles.image} />

          {/* Heart Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsFavorite(!isFavorite)
            }}
            className={styles.favoriteButton}
          >
            <Heart
              size={18}
              className={isFavorite ? styles.favoriteActive : ""}
              fill={isFavorite ? "#ef4444" : "none"}
              color={isFavorite ? "#ef4444" : "#1f2937"}
            />
          </button>

          {/* Category Badge */}
          <div className={styles.categoryBadge}>
            <span className={styles.categoryText}>{product.category}</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h3 className={styles.name}>{product.name}</h3>

          <div className={styles.priceSection}>
            <span className={styles.price}>{formattedPrice}</span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className={styles.addToCartButton}
          >
            <ShoppingCart size={18} />
            <span className={styles.buttonText}>Thêm giỏ</span>
            <span className={styles.buttonTextShort}>Thêm</span>
          </button>
        </div>
      </div>
    </Link>
  )
}
