"use client"

import { Heart, ShoppingCart } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/app/contexts/CartContext"
import { useAuth } from "@/app/contexts/AuthContext"
import { useToast } from "@/app/contexts/ToastContext"
import styles from "./product-card.module.css"

import { Product } from "@/app/lib/api/products"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

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
  const stock = product.SoLuongTonKho || 0
  const isOutOfStock = stock <= 0
  const isDisabled = isOutOfStock || !isAuthenticated || isAdding

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", "warning")
      router.push("/login")
      return
    }

    if (isOutOfStock) {
      showToast("Sản phẩm đã hết hàng", "error")
      return
    }

    setIsAdding(true)
    try {
      await addToCart({
        id: product.MaSP,
        name: product.TenSP,
        price: product.GiaSP || 0,
        image: attributes.image || "/placeholder.svg",
      })
      showToast("Đã thêm sản phẩm vào giỏ hàng", "success")
    } catch (error: any) {
      showToast(error.message || "Không thể thêm sản phẩm vào giỏ hàng", "error")
    } finally {
      setIsAdding(false)
    }
  }

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

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className={styles.outOfStockBadge}>
              <span>Hết hàng</span>
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
                Còn {stock} sản phẩm
              </span>
            )} */}
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isDisabled}
            className={`${styles.addToCartButton} ${isDisabled ? styles.disabled : ""}`}
          >
            <ShoppingCart size={18} />
            <span className={styles.buttonText}>
              {isOutOfStock ? "Hết hàng" : isAdding ? "Đang thêm..." : "Thêm giỏ"}
            </span>
            <span className={styles.buttonTextShort}>
              {isOutOfStock ? "Hết" : isAdding ? "..." : "Thêm"}
            </span>
          </button>
        </div>
      </div>
    </Link>
  )
}
