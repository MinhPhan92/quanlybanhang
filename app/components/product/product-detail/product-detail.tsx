"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Heart, Share2, Star, Loader2, MessageSquare } from "lucide-react"
import { productsApi, Product } from "@/app/lib/api/products"
import { reviewsApi, Review } from "@/app/lib/api/reviews"
import { useCart } from "@/app/contexts/CartContext"
import { useAuth } from "@/app/contexts/AuthContext"
import { useToast } from "@/app/contexts/ToastContext"
import styles from "./product-detail.module.css"

interface ProductDetailProps {
  productId: number | null
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState<number>(0)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    content: "",
  })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (productId) {
      loadProduct()
      loadReviews()
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

  const loadReviews = async () => {
    if (!productId) return
    try {
      setReviewsLoading(true)
      const data = await reviewsApi.getProductReviews(productId, 1, 10)
      setReviews(data.reviews || [])
      setAverageRating(data.average_rating || 0)
    } catch (err: any) {
      console.error("Error loading reviews:", err)
      // Don't show error for reviews, just log it
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleQuantityChange = (e: any) => {
    const value = Number.parseInt(e.target.value) || 1
    const stock = product?.SoLuongTonKho || 0
    if (value > 0 && value <= stock) {
      setQuantity(value)
    } else if (value > stock) {
      setQuantity(stock)
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`, "warning")
    }
  }

  const handleQuantityIncrease = () => {
    const stock = product?.SoLuongTonKho || 0
    if (quantity < stock) {
      setQuantity(quantity + 1)
    } else {
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`, "warning")
    }
  }

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
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

    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", "warning")
      router.push("/login")
      return
    }

    const stock = product.SoLuongTonKho || 0
    if (stock <= 0) {
      showToast("Sản phẩm đã hết hàng", "error")
      return
    }

    if (quantity > stock) {
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`, "error")
      setQuantity(stock)
      return
    }

    // Parse attributes to get image
    const attributes = parseMoTa(product.MoTa)
    const productImages = attributes.images
      ? Array.isArray(attributes.images)
        ? attributes.images
        : [attributes.images]
      : attributes.image
      ? [attributes.image]
      : ["/placeholder.svg"]

    setIsAdding(true)
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
      showToast("Đã thêm sản phẩm vào giỏ hàng", "success")
    } catch (error: any) {
      showToast(error.message || "Không thể thêm sản phẩm vào giỏ hàng", "error")
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return

    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để mua hàng", "warning")
      router.push("/login")
      return
    }

    const stock = product.SoLuongTonKho || 0
    if (stock <= 0) {
      showToast("Sản phẩm đã hết hàng", "error")
      return
    }

    if (quantity > stock) {
      showToast(`Chỉ còn ${stock} sản phẩm trong kho`, "error")
      setQuantity(stock)
      return
    }

    try {
      await handleAddToCart()
      router.push("/checkout")
    } catch (error: any) {
      showToast(error.message || "Không thể thực hiện mua ngay", "error")
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
              <Star
                key={i}
                size={16}
                fill={i < Math.round(averageRating) ? "#fbbf24" : "none"}
                color="#fbbf24"
              />
            ))}
          </div>
          <span className={styles.ratingText}>
            {averageRating > 0
              ? `${averageRating.toFixed(1)}/5 (${reviews.length} đánh giá)`
              : "Chưa có đánh giá"}
          </span>
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

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "description" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Mô tả
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "specifications" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("specifications")}
            >
              Thông số kỹ thuật
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "reviews" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Đánh giá ({reviews.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === "description" && (
              <div className={styles.description}>
                {product.MoTa && !product.MoTa.startsWith("{") ? (
                  <p className={styles.descriptionText}>{product.MoTa}</p>
                ) : (
                  <p className={styles.descriptionText}>
                    Sản phẩm chất lượng cao với thiết kế hiện đại, phù hợp cho mọi không gian gia đình.
                  </p>
                )}
              </div>
            )}

            {activeTab === "specifications" && (
              <div className={styles.specifications}>
                {Object.keys(attributes).length > 0 ? (
                  <div className={styles.specsGrid}>
                    {Object.entries(attributes)
                      .filter(([key]) => !["image", "images"].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className={styles.specItem}>
                          <span className={styles.specLabel}>{key}:</span>
                          <span className={styles.specValue}>{String(value)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className={styles.noSpecs}>Chưa có thông số kỹ thuật</p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className={styles.reviewsSection}>
                {/* Write Review Button */}
                {isAuthenticated && (
                  <div className={styles.writeReviewSection}>
                    {!showReviewForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            showToast("Vui lòng đăng nhập để viết đánh giá", "warning")
                            router.push("/login")
                            return
                          }
                          setShowReviewForm(true)
                        }}
                        className={styles.writeReviewButton}
                      >
                        <MessageSquare size={18} />
                        Viết đánh giá
                      </button>
                    ) : (
                      <div className={styles.reviewForm}>
                        <h3 className={styles.reviewFormTitle}>Viết đánh giá của bạn</h3>
                        <div className={styles.ratingInput}>
                          <label>Đánh giá:</label>
                          <div className={styles.starRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className={styles.starButton}
                              >
                                <Star
                                  size={24}
                                  fill={star <= reviewForm.rating ? "#fbbf24" : "none"}
                                  color="#fbbf24"
                                />
                              </button>
                            ))}
                            <span className={styles.ratingText}>{reviewForm.rating}/5</span>
                          </div>
                        </div>
                        <div className={styles.reviewContentInput}>
                          <label htmlFor="reviewContent">Nội dung đánh giá:</label>
                          <textarea
                            id="reviewContent"
                            value={reviewForm.content}
                            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                            rows={4}
                            className={styles.reviewTextarea}
                          />
                        </div>
                        <div className={styles.reviewFormActions}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowReviewForm(false)
                              setReviewForm({ rating: 5, content: "" })
                            }}
                            className={styles.cancelReviewButton}
                            disabled={submittingReview}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!productId) return
                              setSubmittingReview(true)
                              try {
                                await reviewsApi.createReview({
                                  MaSP: productId,
                                  DiemDanhGia: reviewForm.rating,
                                  NoiDung: reviewForm.content || undefined,
                                })
                                showToast("Đánh giá đã được gửi thành công", "success")
                                setShowReviewForm(false)
                                setReviewForm({ rating: 5, content: "" })
                                await loadReviews()
                              } catch (err: any) {
                                const errorMessage = err.message || "Không thể gửi đánh giá. Vui lòng thử lại."
                                const lowerMessage = errorMessage.toLowerCase()
                                
                                // Check for various error messages about purchasing
                                if (
                                  lowerMessage.includes("mua") || 
                                  lowerMessage.includes("purchase") ||
                                  lowerMessage.includes("đã mua") ||
                                  lowerMessage.includes("chỉ có thể đánh giá")
                                ) {
                                  showToast("Bạn cần mua sản phẩm này trước khi đánh giá", "error")
                                } else if (
                                  lowerMessage.includes("login") || 
                                  lowerMessage.includes("đăng nhập") ||
                                  lowerMessage.includes("unauthorized") ||
                                  lowerMessage.includes("403")
                                ) {
                                  showToast("Vui lòng đăng nhập để viết đánh giá", "error")
                                  router.push("/login")
                                } else {
                                  // Show the actual error message from backend
                                  showToast(errorMessage, "error")
                                }
                              } finally {
                                setSubmittingReview(false)
                              }
                            }}
                            className={styles.submitReviewButton}
                            disabled={submittingReview}
                          >
                            {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className={styles.reviewsLoading}>
                    <Loader2 className={styles.spinner} />
                    <p>Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className={styles.reviewsList}>
                    {reviews.map((review) => (
                      <div key={review.MaDanhGia} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewerInfo}>
                            <div className={styles.reviewerAvatar}>
                              {review.TenKH?.[0]?.toUpperCase() || "K"}
                            </div>
                            <div>
                              <p className={styles.reviewerName}>
                                {review.TenKH || `Khách hàng ${review.MaKH}`}
                              </p>
                              <p className={styles.reviewDate}>
                                {new Date(review.NgayDanhGia).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                          <div className={styles.reviewRating}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < review.DiemDanhGia ? "#fbbf24" : "none"}
                                color="#fbbf24"
                              />
                            ))}
                            <span className={styles.ratingValue}>{review.DiemDanhGia}/5</span>
                          </div>
                        </div>
                        {review.NoiDung && (
                          <p className={styles.reviewContent}>{review.NoiDung}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noReviews}>
                    <p>Chưa có đánh giá nào cho sản phẩm này</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Purchase Section */}
        <div className={styles.purchase}>
          <div className={styles.quantitySection}>
            <label htmlFor="quantity" className={styles.quantityLabel}>
              Số lượng:
            </label>
            <div className={styles.quantityControls}>
              <button
                type="button"
                onClick={handleQuantityDecrease}
                disabled={quantity <= 1}
                className={styles.quantityBtn}
              >
                -
              </button>
              <input
                type="number"
                id="quantity"
                min="1"
                max={product.SoLuongTonKho || 100}
                value={quantity}
                onChange={handleQuantityChange}
                className={styles.quantityInput}
              />
              <button
                type="button"
                onClick={handleQuantityIncrease}
                disabled={quantity >= (product.SoLuongTonKho || 0)}
                className={styles.quantityBtn}
              >
                +
              </button>
            </div>
            {product.SoLuongTonKho !== undefined && (
              <span className={styles.stockInfo}>
                Còn {product.SoLuongTonKho} sản phẩm
              </span>
            )}
          </div>

          <div className={styles.buttons}>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || (product.SoLuongTonKho || 0) <= 0}
              className={`${styles.addToCartBtn} ${isAdding || (product.SoLuongTonKho || 0) <= 0 ? styles.disabled : ""}`}
            >
              {isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isAdding || (product.SoLuongTonKho || 0) <= 0}
              className={`${styles.buyNowBtn} ${isAdding || (product.SoLuongTonKho || 0) <= 0 ? styles.disabled : ""}`}
            >
              Mua ngay
            </button>
          </div>
        </div>

      </section>
    </div>
  )
}
