import Link from "next/link"
import styles from "./related-products.module.css"
import { Heart } from "lucide-react"

export default function RelatedProducts() {
  const products = [
    {
      id: 1,
      name: "Nồi cơm điện thông minh",
      price: 1290000,
      originalPrice: 1890000,
      image: "/n-i-c-m--i-n.jpg",
      rating: 4.8,
    },
    {
      id: 2,
      name: "Máy giặt tự động Samsung",
      price: 7890000,
      originalPrice: 9890000,
      image: "/m-y-gi-t-samsung.jpg",
      rating: 4.9,
    },
    {
      id: 3,
      name: "Tủ lạnh Electrolux 2 cánh",
      price: 12990000,
      originalPrice: 15990000,
      image: "/t--l-nh-electrolux.jpg",
      rating: 4.7,
    },
    {
      id: 4,
      name: "Quạt máy Daikoku điều chỉnh",
      price: 890000,
      originalPrice: 1290000,
      image: "/qu-t-m-y--i-u-ch-nh.jpg",
      rating: 4.6,
    },
  ]

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Sản phẩm liên quan</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <article key={product.id} className={styles.card}>
            <Link href={`/product/${product.id}`} className={styles.imageLink}>
              <div className={styles.imageWrapper}>
                <img src={product.image || "/placeholder.svg"} alt={product.name} />
                <button className={styles.favoriteBtn} aria-label="Thêm vào danh sách yêu thích">
                  <Heart size={20} />
                </button>
              </div>
            </Link>

            <div className={styles.content}>
              <Link href={`/product/${product.id}`} className={styles.nameLink}>
                <h3 className={styles.name}>{product.name}</h3>
              </Link>

              <div className={styles.rating}>
                <span className={styles.stars}>★★★★★</span>
                <span className={styles.ratingValue}>{product.rating}</span>
              </div>

              <div className={styles.priceSection}>
                <span className={styles.originalPrice}>{product.originalPrice.toLocaleString()}₫</span>
                <span className={styles.price}>{product.price.toLocaleString()}₫</span>
                <span className={styles.discount}>
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              </div>

              <button className={styles.addBtn}>Thêm vào giỏ</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
