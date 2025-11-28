"use client"

import { useState } from "react"
import styles from "./contact-form.module.css"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e:any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e:any) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    setSubmitted(true)
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    })
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className={styles.formWrapper}>
      <h2 className={styles.formTitle}>Gửi Tin Nhắn Cho Chúng Tôi</h2>

      {submitted && <div className={styles.successMessage}>Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Họ và tên
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Nhập tên của bạn"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Nhập email của bạn"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone" className={styles.label}>
            Số điện thoại
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={styles.input}
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="subject" className={styles.label}>
            Chủ đề
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Chủ đề liên hệ"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="message" className={styles.label}>
            Tin nhắn
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className={styles.textarea}
            placeholder="Nhập tin nhắn của bạn"
          ></textarea>
        </div>

        <button type="submit" className={styles.submitButton}>
          Gửi Tin Nhắn
        </button>
      </form>
    </div>
  )
}
