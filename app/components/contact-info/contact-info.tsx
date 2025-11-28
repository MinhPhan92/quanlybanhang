import { Mail, Phone, MapPin, Clock } from "lucide-react"
import styles from "./contact-info.module.css"

export default function ContactInfo() {
  const contactMethods = [
    {
      icon: Phone,
      title: "Gọi Cho Chúng Tôi",
      content: "1900 1234",
      subtext: "Thứ 2 - Thứ 6: 8:00 - 17:00",
    },
    {
      icon: Mail,
      title: "Email",
      content: "support@giaduc.vn",
      subtext: "Phản hồi trong vòng 24 giờ",
    },
    {
      icon: MapPin,
      title: "Địa Chỉ",
      content: "123 Đường ABC, Hà Nội",
      subtext: "Việt Nam",
    },
    {
      icon: Clock,
      title: "Giờ Làm Việc",
      content: "Thứ 2 - Thứ 6: 8:00 - 17:00",
      subtext: "Thứ 7 - Chủ Nhật: 9:00 - 16:00",
    },
  ]

  return (
    <div className={styles.infoContainer}>
      <h2 className={styles.infoTitle}>Thông Tin Liên Hệ</h2>

      <div className={styles.methodsGrid}>
        {contactMethods.map((method, index) => {
          const IconComponent = method.icon
          return (
            <div key={index} className={styles.methodCard}>
              <div className={styles.iconBox}>
                <IconComponent size={24} className={styles.icon} />
              </div>
              <h3 className={styles.methodTitle}>{method.title}</h3>
              <p className={styles.methodContent}>{method.content}</p>
              <p className={styles.methodSubtext}>{method.subtext}</p>
            </div>
          )
        })}
      </div>

      <div className={styles.socialSection}>
        <h3 className={styles.socialTitle}>Theo Dõi Chúng Tôi</h3>
        <div className={styles.socialLinks}>
          <a href="#" className={styles.socialLink} aria-label="Facebook">
            Facebook
          </a>
          <a href="#" className={styles.socialLink} aria-label="Instagram">
            Instagram
          </a>
          <a href="#" className={styles.socialLink} aria-label="Twitter">
            Twitter
          </a>
          <a href="#" className={styles.socialLink} aria-label="LinkedIn">
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  )
}
