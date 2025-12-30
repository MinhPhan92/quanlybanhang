import Header from "./components/shared/header/Header"
import Hero from "./components/shared/hero/hero"
import ProductGrid from "./components/home/product-grid/product-grid"
import Footer from "./components/shared/footer/Footer"
import styles from "./page.module.css"

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <Hero />
      <ProductGrid />
      <Footer />
    </div>
  )
}
