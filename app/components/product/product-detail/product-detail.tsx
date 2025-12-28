"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Heart, Share2, Star, Loader2 } from "lucide-react"
import { productsApi, Product } from "@/app/lib/api/products"
import { useCart } from "@/app/contexts/CartContext"
import styles from "./product-detail.module.css"

interface ProductDetailProps {
  productId: number | null
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (productId) {
      loadProduct()
    } else {
      setError("Không tìm thấy sản phẩm")
      setLoading(false)
    }
  }, [productId])

  const loadProduct = async () => {
    if (!productId) return
    try {
      setLoading(true)
      setError(null)
      const data = await productsApi.getOne(productId)
      setProduct(data)
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin sản phẩm")
      console.error("Error loading product:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (e: any) => {
    const value = Number.parseInt(e.target.value)
    if (value > 0) setQuantity(value)
  }

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

  const handleAddToCart = async () => {
    if (!product) return

    // Parse attributes to get image
    const attributes = parseMoTa(product.MoTa)
    const productImages = attributes.images
      ? Array.isArray(attributes.images)
        ? attributes.images
        : [attributes.images]
      : attributes.image
      ? [attributes.image]
      : ["/placeholder.svg"]

    try {
      await addToCart(
        {
          id: product.MaSP,
          name: product.TenSP,
          price: product.GiaSP || 0,
          image: attributes.image || productImages[0] || "/placeholder.svg",
        },
        quantity
      )
    } catch (error) {
      // Error is already handled in CartContext
      console.error("Failed to add to cart:", error)
    }
  }

  const handleBuyNow = async () => {
    try {
      await handleAddToCart()
      router.push("/checkout")
    } catch (error) {
      // Error is already handled in handleAddToCart
      console.error("Failed to buy now:", error)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} />
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className={styles.errorContainer}>
        <p>{error || "Không tìm thấy sản phẩm"}</p>
      </div>
    )
  }

  // Parse attributes from MoTa (safe parsing)
  const attributes = parseMoTa(product.MoTa)

  // Get images from attributes or use placeholder
  const images = attributes.images
    ? Array.isArray(attributes.images)
      ? attributes.images
      : [attributes.images]
    : attributes.image
    ? [attributes.image]
    : ["/placeholder.svg"]

  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(product.GiaSP || 0)

  return (
    <div className={styles.container}>
      {/* Gallery Section */}
      <section className={styles.gallery}>
        {/* Main Image */}
        <div className={styles.mainImage}>
          <img src={images[activeImage] || "/placeholder.svg"} alt="Sản phẩm chính" />
        </div>

        {/* Thumbnails */}
        <div className={styles.thumbnails}>
          {images.map((img, idx) => (
            <button
              type="button"
              key={idx}
              className={`${styles.thumbnail} ${activeImage === idx ? styles.active : ""}`}
              onClick={() => setActiveImage(idx)}
            >
              <img src={img || "/placeholder.svg"} alt={`Hình ${idx + 1}`} />
            </button>
          ))}
        </div>
      </section>

      {/* Details Section */}
      <section className={styles.details}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            {product.TenDanhMuc && (
              <span className={styles.category}>{product.TenDanhMuc}</span>
            )}
            <h1 className={styles.title}>{product.TenSP}</h1>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.favoriteBtn}
              onClick={() => setIsFavorite(!isFavorite)}
              title="Thêm vào danh sách yêu thích"
            >
              <Heart size={24} fill={isFavorite ? "#ff8c42" : "none"} color={isFavorite ? "#ff8c42" : "#1f2937"} />
            </button>
            <button type="button" className={styles.shareBtn} title="Chia sẻ sản phẩm">
              <Share2 size={24} />
            </button>
          </div>
        </div>

        {/* Rating & Reviews Preview */}
        <div className={styles.rating}>
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
            ))}
          </div>
          <span className={styles.ratingText}>4.8/5 (128 đánh giá)</span>
        </div>

        {/* Price Section */}
        <div className={styles.priceSection}>
          <div className={styles.priceBlock}>
            <span className={styles.currentPrice}>{formattedPrice}</span>
            {product.SoLuongTonKho !== undefined && (
              <span className={styles.stock}>
                Còn {product.SoLuongTonKho} sản phẩm
              </span>
            )}
          </div>
          <div className={styles.shipping}>
            <span className={styles.shippingLabel}>Miễn phí vận chuyển</span>
            <span className={styles.deliveryTime}>Giao trong 2-3 ngày</span>
          </div>
        </div>

        {/* Highlights */}
        {Object.keys(attributes).length > 0 && (
          <div className={styles.highlights}>
            {Object.entries(attributes)
              .filter(([key]) => !["image", "images"].includes(key))
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className={styles.highlight}>
                  <span className={styles.highlightLabel}>{key}</span>
                  <span className={styles.highlightValue}>
                    {String(value)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Description */}
        {product.MoTa && !product.MoTa.startsWith("{") && (
          <div className={styles.description}>
            <h2 className={styles.descriptionTitle}>Mô tả sản phẩm</h2>
            <p className={styles.descriptionText}>{product.MoTa}</p>
          </div>
        )}

        {/* Purchase Section */}
        <div className={styles.purchase}>
          <div className={styles.quantitySection}>
            <label htmlFor="quantity" className={styles.quantityLabel}>
              Số lượng:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max="100"
              value={quantity}
              onChange={handleQuantityChange}
              className={styles.quantityInput}
            />
          </div>

          <div className={styles.buttons}>
            <button
              type="button"
              onClick={handleAddToCart}
              className={styles.addToCartBtn}
            >
              Thêm vào giỏ hàng
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className={styles.buyNowBtn}
            >
              Mua ngay
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        {/* TODO: Implement reviews API integration */}
        <div className={styles.reviewsSection}>
          <h2 className={styles.reviewsTitle}>Đánh giá từ khách hàng</h2>
          <div className={styles.reviewsList}>
            <p className={styles.noReviews}>Chưa có đánh giá nào</p>
          </div>
        </div>
      </section>
    </div>
  )
}
