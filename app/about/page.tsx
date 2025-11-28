import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import styles from "./about.module.css"

export default function AboutPage() {
  return (
    <div>
      <Header />
      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Về Chúng Tôi</h1>
            <p className={styles.heroSubtitle}>
              Đi tiên phong trong ngành công nghiệp đồ gia dụng với các sản phẩm chất lượng cao và dịch vụ xuất sắc
            </p>
          </div>
        </section>

        {/* Company Info Section */}
        <section className={styles.infoSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Câu Chuyện Của Chúng Tôi</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>Thành Lập Năm 2010</h3>
                <p className={styles.cardText}>
                  Với hơn 14 năm kinh nghiệm, chúng tôi đã phục vụ hàng triệu khách hàng trên toàn quốc với các sản phẩm
                  gia dụng chất lượng cao.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>Sứ Mệnh</h3>
                <p className={styles.cardText}>
                  Mang công nghệ hiện đại và thiết kế tối ưu vào mỗi gia đình, giúp cuộc sống hàng ngày trở nên tiện lợi
                  và dễ chịu hơn.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>Tầm Nhìn</h3>
                <p className={styles.cardText}>
                  Trở thành thương hiệu hàng đầu về đồ gia dụng tại Đông Nam Á, nổi tiếng về chất lượng, dịch vụ và sự
                  đổi mới không ngừng.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={styles.valuesSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Giá Trị Cốt Lõi Của Chúng Tôi</h2>
            <div className={styles.valuesGrid}>
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>✓</div>
                <h3 className={styles.valueTitle}>Chất Lượng</h3>
                <p className={styles.valueText}>
                  Mọi sản phẩm đều trải qua kiểm tra chất lượng nghiêm ngặt để đảm bảo độ bền và hiệu suất tối ưu.
                </p>
              </div>
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>⚡</div>
                <h3 className={styles.valueTitle}>Đổi Mới</h3>
                <p className={styles.valueText}>
                  Liên tục cập nhật công nghệ mới nhất để mang đến những sản phẩm tiên tiến nhất cho khách hàng.
                </p>
              </div>
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>❤</div>
                <h3 className={styles.valueTitle}>Tâm Huyết</h3>
                <p className={styles.valueText}>
                  Chúng tôi luôn lắng nghe và chăm sóc khách hàng, đặt nhu cầu của họ lên hàng đầu.
                </p>
              </div>
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}>🌱</div>
                <h3 className={styles.valueTitle}>Bền Vững</h3>
                <p className={styles.valueText}>
                  Cam kết sử dụng nguyên liệu thân thiện với môi trường và các quy trình sản xuất bền vững.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className={styles.teamSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Đội Ngũ Chúng Tôi</h2>
            <div className={styles.teamGrid}>
              <div className={styles.teamCard}>
                <div className={styles.teamImage}>
                  <img src="/anhceo3.jpg" alt="CEO" />
                </div>
                <h3 className={styles.teamName}>Trần Văn Hiệp</h3>
                <p className={styles.teamPosition}>Giám Đốc Điều Hành</p>
                <p className={styles.teamBio}>
                  Có 20 năm kinh nghiệm trong ngành công nghiệp gia dụng và quản lý kinh doanh.
                </p>
              </div>
              <div className={styles.teamCard}>
                <div className={styles.teamImage}>
                  <img src="/anhceo2.jpg" alt="Production Director" />
                </div>
                <h3 className={styles.teamName}>Hiệp Trần Văn</h3>
                <p className={styles.teamPosition}>Giám Đốc Sản Xuất</p>
                <p className={styles.teamBio}>
                  Chuyên gia quản lý chất lượng sản phẩm với hơn 15 năm kinh nghiệm trong ngành.
                </p>
              </div>
              <div className={styles.teamCard}>
                <div className={styles.teamImage}>
                  <img src="/anhceo1.jpg" alt="Marketing Director" />
                </div>
                <h3 className={styles.teamName}>Văn Trần Hiệp</h3>
                <p className={styles.teamPosition}>Giám Đốc Tiếp Thị</p>
                <p className={styles.teamBio}>
                  Tiên phong trong chiến lược tiếp thị kỹ thuật số và xây dựng thương hiệu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.container}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>1M+</div>
                <p className={styles.statLabel}>Khách Hàng</p>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>500+</div>
                <p className={styles.statLabel}>Sản Phẩm</p>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>50+</div>
                <p className={styles.statLabel}>Đối Tác</p>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>14+</div>
                <p className={styles.statLabel}>Năm Kinh Nghiệm</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.ctaTitle}>Hãy Trở Thành Phần Của Gia Đình Chúng Tôi</h2>
            <p className={styles.ctaText}>
              Khám phá hàng ngàn sản phẩm gia dụng chất lượng cao tại giá cạnh tranh nhất
            </p>
            <button className={styles.ctaButton}>Mua Sắm Ngay</button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
