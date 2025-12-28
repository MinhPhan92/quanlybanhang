"use client"

import { useEffect } from "react"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import ContactForm from "../components/contact-form/contact-form"
import ContactInfo from "../components/contact-info/contact-info"
import styles from "./contact.module.css"

export default function ContactPage() {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.wrapper}>
          {/* Hero Section */}
          <section className={styles.hero}>
            <h1 className={styles.title}>Liên Hệ Với Chúng Tôi</h1>
            <p className={styles.subtitle}>
              Chúng tôi luôn sẵn sàng trả lời mọi câu hỏi và hỗ trợ bạn. 
              Điền form bên dưới hoặc liên hệ trực tiếp qua thông tin bên cạnh.
            </p>
          </section>

          {/* Contact Container */}
          <section className={styles.contactContainer}>
            <div className={styles.contactContent}>
              <ContactForm />
              <ContactInfo />
            </div>
          </section>

          {/* Map Section */}
          <section className={styles.mapSection}>
            <h2 className={styles.mapTitle}>Tìm Chúng Tôi</h2>
            <p className={styles.mapSubtitle}>
              Ghé thăm cửa hàng của chúng tôi tại địa chỉ dưới đây
            </p>
            <div className={styles.mapContainer}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.8688651315397!2d105.78472381109384!3d21.028476288848417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac6227d29f19%3A0x92f0ae4feffff!2s123%20%C4%90%C6%B0%E1%BB%9Dng%20ABC%2C%20H%C3%A0%20N%E1%BB%99i!5e0!3m2!1svi!2s!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: "0.5rem" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Địa chỉ cửa hàng"
              ></iframe>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
