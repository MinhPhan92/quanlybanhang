"use client"

import { useState } from "react"
import { Heart, Share2, Star } from "lucide-react"
import styles from "./product-detail.module.css"

export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  const images = [
    "/m-y-h-t-b-i-hi-n---i.jpg",
    "/m-y-h-t-b-i-t--nhi-u-g-c.jpg",
    "/m-y-h-t-b-i-th-ng-s-.jpg",
    "/m-y-h-t-b-i-b-o-h-nh.jpg",
  ]

  const reviews = [
    { rating: 5, text: "Sản phẩm rất tốt, giao hàng nhanh!" },
    { rating: 5, text: "Chất lượng vượt mong đợi, sẽ mua lại." },
    { rating: 4, text: "Tốt nhưng hơi lớn hơn dự tính." },
  ]

  const handleQuantityChange = (e:any) => {
    const value = Number.parseInt(e.target.value)
    if (value > 0) setQuantity(value)
  }

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
            <span className={styles.category}>Thiết bị làm sạch</span>
            <h1 className={styles.title}>Máy Hút Bụi Thông Minh Philips Series 3000</h1>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.favoriteBtn}
              onClick={() => setIsFavorite(!isFavorite)}
              title="Thêm vào danh sách yêu thích"
            >
              <Heart size={24} fill={isFavorite ? "#ff8c42" : "none"} color={isFavorite ? "#ff8c42" : "#1f2937"} />
            </button>
            <button className={styles.shareBtn} title="Chia sẻ sản phẩm">
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
            <span className={styles.originalPrice}>3.990.000₫</span>
            <span className={styles.currentPrice}>2.890.000₫</span>
            <span className={styles.discount}>-27%</span>
          </div>
          <div className={styles.shipping}>
            <span className={styles.shippingLabel}>Miễn phí vận chuyển</span>
            <span className={styles.deliveryTime}>Giao trong 2-3 ngày</span>
          </div>
        </div>

        {/* Highlights */}
        <div className={styles.highlights}>
          <div className={styles.highlight}>
            <span className={styles.highlightLabel}>Công suất</span>
            <span className={styles.highlightValue}>2200W</span>
          </div>
          <div className={styles.highlight}>
            <span className={styles.highlightLabel}>Dung tích</span>
            <span className={styles.highlightValue}>3L</span>
          </div>
          <div className={styles.highlight}>
            <span className={styles.highlightLabel}>Bảo hành</span>
            <span className={styles.highlightValue}>2 năm</span>
          </div>
          <div className={styles.highlight}>
            <span className={styles.highlightLabel}>Màu sắc</span>
            <span className={styles.highlightValue}>Đen/Trắng</span>
          </div>
        </div>

        {/* Description */}
        <div className={styles.description}>
          <h2 className={styles.descriptionTitle}>Mô tả sản phẩm</h2>
          <ul className={styles.descriptionList}>
            <li>Công suất 2200W mạnh mẽ, hút sạch bụi hiệu quả</li>
            <li>Bộ lọc HEPA cao cấp, bảo vệ sức khỏe gia đình</li>
            <li>Thiết kế nhẹ nhàng, dễ sử dụng và bảo trì</li>
            <li>Tương thích với nhiều loại mặt sàn khác nhau</li>
            <li>Chế độ êm ớt, phù hợp sử dụng ban đêm</li>
          </ul>
        </div>

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
            <button className={styles.addToCartBtn}>Thêm vào giỏ hàng</button>
            <button className={styles.buyNowBtn}>Mua ngay</button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.reviewsSection}>
          <h2 className={styles.reviewsTitle}>Đánh giá từ khách hàng</h2>
          <div className={styles.reviewsList}>
            {reviews.map((review, idx) => (
              <div key={idx} className={styles.reviewItem}>
                <div className={styles.reviewStars}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p className={styles.reviewText}>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
