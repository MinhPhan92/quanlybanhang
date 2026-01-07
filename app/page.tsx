import Header from "./components/shared/header/Header"
import Hero from "./components/shared/hero/hero"
import FeaturedCategories from "./components/home/featured-categories/featured-categories"
import BestsellingProducts from "./components/home/bestselling-products/bestselling-products"
import NewProducts from "./components/home/new-products/new-products"
import PromotionalBanner from "./components/home/promotional-banner/promotional-banner"
import ProductGrid from "./components/home/product-grid/product-grid"
import WhyChoose from "./components/home/why-choose/why-choose"
import Footer from "./components/shared/footer/Footer"
import styles from "./page.module.css"

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <Hero />
      <FeaturedCategories />
      <BestsellingProducts />
      <PromotionalBanner />
      <NewProducts />
      <ProductGrid />
      <WhyChoose />
      <Footer />
    </div>
  )
}
