"use client"

import { useParams } from "next/navigation"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import ProductDetail from "@/app/components/product/product-detail/product-detail"
import RelatedProducts from "@/app/components/product/related-products/related-product"
import styles from "./product.module.css"

export default function ProductPage() {
  const params = useParams()
  const productId = params?.id ? Number(params.id) : null

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <ProductDetail productId={productId} />
        <RelatedProducts currentProductId={productId} />
      </main>
      <Footer />
    </div>
  )
}
