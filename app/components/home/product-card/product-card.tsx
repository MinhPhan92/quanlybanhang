"use client"

import { Heart, ShoppingCart } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/app/contexts/CartContext"
import styles from "./product-card.module.css"

import { Product } from "@/app/lib/api/products"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const { addToCart } = useCart()

  const formattedPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)

  // Safe MoTa parsing helper
  const parseMoTa = (moTa: string | undefined): Record<string, any> => {
    if (!moTa) return {}
    if (typeof moTa === "string") {
      try {
        return JSON.parse(moTa)
      } catch {
        return {}
      }
    }
    return typeof moTa === "object" ? moTa : {}
  }

  // Parse attributes from MoTa if it's JSON
  const attributes = parseMoTa(product.MoTa)

  return (
    <Link href={`/product/${product.MaSP}`} className={styles.link}>
      <div className={styles.card}>
        {/* Image Container */}
        <div className={styles.imageContainer}>
          <img
            src={attributes.image || "/placeholder.svg"}
            alt={product.TenSP}
            className={styles.image}
          />

          {/* Heart Button */}
          {/* <button
            type="button"
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
          </button> */}

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
            <span className={styles.price}>{formattedPrice(product.GiaSP || 0)}</span>
            {/* {product.SoLuongTonKho !== undefined && (
              <span className={styles.stock}>
                Còn {product.SoLuongTonKho} sản phẩm
              </span>
            )} */}
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              try {
                await addToCart({
                  id: product.MaSP,
                  name: product.TenSP,
                  price: product.GiaSP || 0,
                  image: attributes.image || "/placeholder.svg",
                })
              } catch (error) {
                // Error is already handled in CartContext
                console.error("Failed to add to cart:", error)
              }
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
