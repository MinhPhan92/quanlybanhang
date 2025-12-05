"use client"

import { Heart, ShoppingCart } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import styles from "./product-card.module.css"

import { Product } from "@/app/lib/api/products"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(product.GiaSP || 0)

  // Parse attributes from MoTa if it's JSON
  let attributes: Record<string, any> = {}
  if (product.MoTa) {
    try {
      attributes = JSON.parse(product.MoTa)
    } catch {
      // If not JSON, use as is
    }
  }

  return (
    <Link href={`/product/${product.MaSP}`}>
      <div className={styles.card}>
        {/* Image Container */}
        <div className={styles.imageContainer}>
          <img
            src={attributes.image || "/placeholder.svg"}
            alt={product.TenSP}
            className={styles.image}
          />

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
          {product.TenDanhMuc && (
            <div className={styles.categoryBadge}>
              <span className={styles.categoryText}>{product.TenDanhMuc}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h3 className={styles.name}>{product.TenSP}</h3>

          <div className={styles.priceSection}>
            <span className={styles.price}>{formattedPrice}</span>
            {product.SoLuongTonKho !== undefined && (
              <span className={styles.stock}>
                Còn {product.SoLuongTonKho} sản phẩm
              </span>
            )}
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
