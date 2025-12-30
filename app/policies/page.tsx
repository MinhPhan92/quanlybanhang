"use client"

import { useState } from "react"
import Header from "../components/shared/header/Header"
import Footer from "../components/shared/footer/Footer"
import styles from "./policies.module.css"

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState("privacy")

  const tabs = [
    { id: "privacy", label: "Chính sách bảo mật" },
    { id: "terms", label: "Điều khoản dịch vụ" },
    { id: "refund", label: "Chính sách hoàn trả" },
    { id: "shipping", label: "Chính sách vận chuyển" },
  ]

  return (
    <div>
      <Header />

      <main>
        <div className={styles.container}>
          <div className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Chính sách & Điều khoản</h1>
              <p className={styles.heroSubtitle}>
                Bạn có thể tìm thấy tất cả thông tin quan trọng về các chính sách của chúng tôi
              </p>
            </div>
          </div>

          <div className={styles.wrapper}>
            <div className={styles.tabsContainer}>
              <div className={styles.tabs}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.content}>
              {activeTab === "privacy" && (
                <div className={styles.policySection}>
                  <h2 className={styles.sectionTitle}>Chính sách bảo mật</h2>
                  <div className={styles.policyContent}>
                    <h3>1. Thu thập thông tin</h3>
                    <p>
                      Chúng tôi thu thập thông tin khi bạn đặt hàng, tạo tài khoản hoặc liên hệ với chúng tôi. Thông tin
                      bao gồm tên, email, địa chỉ, số điện thoại và thông tin thanh toán.
                    </p>

                    <h3>2. Sử dụng thông tin</h3>
                    <p>
                      Thông tin của bạn được sử dụng để xử lý đơn hàng, cải thiện dịch vụ, gửi cập nhật và giữ liên hệ
                      với bạn về các chương trình khuyến mãi.
                    </p>

                    <h3>3. Bảo vệ thông tin</h3>
                    <p>
                      Chúng tôi sử dụng các biện pháp bảo security tiên tiến để bảo vệ thông tin cá nhân của bạn khỏi
                      truy cập trái phép.
                    </p>

                    <h3>4. Cookie</h3>
                    <p>
                      Chúng tôi sử dụng cookie để nâng cao trải nghiệm duyệt web của bạn. Bạn có thể vô hiệu hóa cookie
                      thông qua cài đặt trình duyệt.
                    </p>

                    <h3>5. Chia sẻ thông tin</h3>
                    <p>
                      Chúng tôi không bao giờ bán hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba mà không có sự
                      đồng ý của bạn.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "terms" && (
                <div className={styles.policySection}>
                  <h2 className={styles.sectionTitle}>Điều khoản dịch vụ</h2>
                  <div className={styles.policyContent}>
                    <h3>1. Chấp nhận điều khoản</h3>
                    <p>
                      Bằng cách truy cập và sử dụng trang web của chúng tôi, bạn đồng ý chịu các điều khoản và điều kiện
                      này.
                    </p>

                    <h3>2. Quyền sở hữu trí tuệ</h3>
                    <p>
                      Tất cả nội dung trên trang web của chúng tôi, bao gồm văn bản, hình ảnh, logo, là tài sản trí tuệ
                      của chúng tôi.
                    </p>

                    <h3>3. Giới hạn trách nhiệm</h3>
                    <p>
                      Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp hoặc ngẫu nhiên phát sinh từ việc
                      sử dụng dịch vụ của chúng tôi.
                    </p>

                    <h3>4. Hành vi của người dùng</h3>
                    <p>
                      Bạn đồng ý không sử dụng trang web của chúng tôi cho bất kỳ mục đích bất hợp pháp hoặc không được
                      phép.
                    </p>

                    <h3>5. Thay đổi điều khoản</h3>
                    <p>
                      Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay
                      khi đăng trên trang web.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "refund" && (
                <div className={styles.policySection}>
                  <h2 className={styles.sectionTitle}>Chính sách hoàn trả</h2>
                  <div className={styles.policyContent}>
                    <h3>1. Thời hạn hoàn trả</h3>
                    <p>
                      Khách hàng có thể yêu cầu hoàn trả trong vòng 30 ngày từ ngày mua hàng. Sản phẩm phải ở trạng thái
                      nguyên bản và chưa sử dụng.
                    </p>

                    <h3>2. Điều kiện hoàn trả</h3>
                    <p>
                      Sản phẩm phải có kèm hóa đơn, hộp nguyên bản và toàn bộ phụ kiện. Chúng tôi không chấp nhận hoàn
                      trả sản phẩm bị hư hỏng do lỗi của khách hàng.
                    </p>

                    <h3>3. Quy trình hoàn trả</h3>
                    <p>
                      Liên hệ bộ phận chăm sóc khách hàng, cung cấp thông tin đơn hàng và lý do hoàn trả. Chúng tôi sẽ
                      gửi nhãn vận chuyển cho bạn.
                    </p>

                    <h3>4. Hoàn tiền</h3>
                    <p>Hoàn tiền sẽ được xử lý trong vòng 7-10 ngày làm việc kể từ khi chúng tôi nhận hàng trở lại.</p>

                    <h3>5. Ngoại lệ</h3>
                    <p>Một số sản phẩm nhất định, chẳng hạn như đồ điện tử, không được hoàn trả nếu đã được sử dụng.</p>
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className={styles.policySection}>
                  <h2 className={styles.sectionTitle}>Chính sách vận chuyển</h2>
                  <div className={styles.policyContent}>
                    <h3>1. Phương thức giao hàng</h3>
                    <p>
                      Chúng tôi cung cấp nhiều phương thức giao hàng: Tiêu chuẩn (5-7 ngày), Nhanh (2-3 ngày), Siêu tốc
                      (1 ngày).
                    </p>

                    <h3>2. Phí vận chuyển</h3>
                    <p>
                      Phí vận chuyển được tính dựa trên địa chỉ giao hàng và phương thức giao hàng. Giao hàng miễn phí
                      cho đơn hàng từ 10 triệu đồng.
                    </p>

                    <h3>3. Thời gian giao hàng</h3>
                    <p>
                      Các đơn hàng được xử lý trong vòng 24 giờ. Thời gian giao hàng tính từ ngày đơn hàng được gửi đi.
                    </p>

                    <h3>4. Theo dõi đơn hàng</h3>
                    <p>
                      Bạn sẽ nhận được số theo dõi qua email. Sử dụng số này để theo dõi đơn hàng của bạn bất cứ lúc
                      nào.
                    </p>

                    <h3>5. Đơn hàng bị mất hoặc hư hỏng</h3>
                    <p>
                      Nếu đơn hàng bị mất hoặc hư hỏng trong quá trình vận chuyển, vui lòng liên hệ với chúng tôi trong
                      vòng 48 giờ.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
