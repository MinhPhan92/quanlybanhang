import { Mail, Phone, MapPin } from "lucide-react"
import styles from "./Footer.module.css"

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrapper}>
        <div className={styles.grid}>
          {/* Company Info */}
          <div>
            <div className={styles.companyHeader}>
              <div className={styles.companyBadge}>
                <span className={styles.companyBadgeText}>GD</span>
              </div>
              <span className={styles.companyName}>GiaDungPlus</span>
            </div>
            <p className={styles.companyDescription}>
              Cung cấp những sản phẩm gia dụng chất lượng cao nhất cho gia đình Việt Nam.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={styles.sectionTitle}>Liên kết nhanh</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="#" className={styles.link}>
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  Sản phẩm
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  Giới thiệu
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className={styles.sectionTitle}>Chính sách</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="#" className={styles.link}>
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  Chính sách hoàn trả
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  Vận chuyển
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={styles.sectionTitle}>Liên hệ</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <Phone size={16} className={styles.contactIcon} />
                <span className={styles.contactText}>1900 1234</span>
              </li>
              <li className={styles.contactItem}>
                <Mail size={16} className={styles.contactIcon} />
                <span className={styles.contactText}>support@giadung.vn</span>
              </li>
              <li className={styles.contactItem}>
                <MapPin size={16} className={styles.contactIcon} />
                <span className={styles.contactText}>123 Đường ABC, Hà Nội, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>&copy; 2025 Gia Dụng Plus. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
