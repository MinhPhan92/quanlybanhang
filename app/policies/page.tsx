"use client";

import { useState } from "react";
import Header from "../components/shared/header/Header";
import Footer from "../components/shared/footer/Footer";
import styles from "./policies.module.css";

// Policy content matching backend chatbot_constants.py
const POLICIES = {
  bao_hanh: {
    title: "Chính sách bảo hành",
    content: `Tất cả sản phẩm được bảo hành 12 tháng kể từ ngày mua.

Bảo hành áp dụng:
   - Lỗi kỹ thuật do nhà sản xuất
   - Sử dụng bình thường theo hướng dẫn

Không áp dụng bảo hành:
   - Sản phẩm bị rơi vỡ, va đập mạnh
   - Sản phẩm bị vào nước
   - Sử dụng sai hướng dẫn hoặc mục đích

Liên hệ: Khi sản phẩm gặp lỗi kỹ thuật, vui lòng liên hệ cửa hàng để được hướng dẫn bảo hành.`,
  },
  doi_tra: {
    title: "Chính sách đổi trả",
    content: `Thời hạn: 30 ngày kể từ ngày mua hàng

Điều kiện áp dụng:
   - Sản phẩm còn nguyên tem, hộp và phụ kiện
   - Sản phẩm chưa qua sử dụng
   - Có kèm hóa đơn mua hàng

Không áp dụng:
   - Sản phẩm khuyến mãi, giảm giá đặc biệt
   - Sản phẩm điện tử đã sử dụng
   - Sản phẩm bị hư hỏng do lỗi khách hàng

Quy trình:
   1. Liên hệ bộ phận CSKH
   2. Cung cấp thông tin đơn hàng và lý do
   3. Nhận nhãn vận chuyển
   4. Hoàn tiền trong 7-10 ngày làm việc`,
  },
  thanh_toan: {
    title: "Chính sách thanh toán",
    content: `Cửa hàng hỗ trợ các hình thức thanh toán:

Thanh toán khi nhận hàng (COD)
   - An toàn, tiện lợi
   - Kiểm tra hàng trước khi thanh toán

Chuyển khoản ngân hàng
   - Thông tin tài khoản sẽ được gửi khi đặt hàng
   - Đơn hàng được xử lý sau khi nhận thanh toán

Ví điện tử
   - Hỗ trợ: Momo, ZaloPay, VNPay
   - Thanh toán nhanh chóng, bảo mật

Liên hệ: Hình thức thanh toán cụ thể sẽ được xác nhận khi đặt hàng.`,
  },
  van_chuyen: {
    title: "Chính sách vận chuyển",
    content: `Thời gian giao hàng:
   - Tiêu chuẩn: 5-7 ngày
   - Nhanh: 2-3 ngày
   - Siêu tốc: 1 ngày

Phí vận chuyển:
   - Tính theo địa chỉ và phương thức giao hàng
   - MIỄN PHÍ cho đơn hàng từ 10 triệu đồng

Xử lý đơn hàng:
   - Đơn hàng được xử lý trong 24 giờ
   - Gửi mã theo dõi qua email/SMS

Đơn hàng bị mất/hư hỏng:
   - Liên hệ trong vòng 48 giờ kể từ khi nhận
   - Cửa hàng sẽ xử lý và đổi hàng mới`,
  },
};

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState("bao_hanh");

  const tabs = [
    { id: "bao_hanh", label: "Bảo hành" },
    { id: "doi_tra", label: "Đổi trả" },
    { id: "van_chuyen", label: "Vận chuyển" },
    { id: "thanh_toan", label: "Thanh toán" },
  ];

  return (
    <div>
      <Header />

      <main>
        <div className={styles.container}>
          <div className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Chính sách & Điều khoản</h1>
              <p className={styles.heroSubtitle}>
                Bạn có thể tìm thấy tất cả thông tin quan trọng về các chính
                sách của chúng tôi
              </p>
            </div>
          </div>

          <div className={styles.wrapper}>
            <div className={styles.tabsContainer}>
              <div className={styles.tabs}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`${styles.tab} ${
                      activeTab === tab.id ? styles.activeTab : ""
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.content}>
              {Object.entries(POLICIES).map(
                ([key, policy]) =>
                  activeTab === key && (
                    <div key={key} className={styles.policySection}>
                      <h2 className={styles.sectionTitle}>{policy.title}</h2>
                      <div className={styles.policyContent}>
                        {policy.content.split("\n\n").map((paragraph, idx) => (
                          <div key={idx} className={styles.paragraph}>
                            {paragraph.split("\n").map((line, lineIdx) => (
                              <div key={lineIdx} className={styles.line}>
                                {line}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
