"use client"

import { useState } from "react"
import { contactApi, ContactFormData } from "@/app/lib/api/contact"
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập họ và tên"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Họ và tên phải có ít nhất 2 ký tự"
    }

    if (!formData.email.trim()) {
      errors.email = "Vui lòng nhập email"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email không hợp lệ"
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ"
    }

    if (!formData.subject.trim()) {
      errors.subject = "Vui lòng nhập chủ đề"
    } else if (formData.subject.trim().length < 3) {
      errors.subject = "Chủ đề phải có ít nhất 3 ký tự"
    }

    if (!formData.message.trim()) {
      errors.message = "Vui lòng nhập tin nhắn"
    } else if (formData.message.trim().length < 10) {
      errors.message = "Tin nhắn phải có ít nhất 10 ký tự"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    // Clear general error
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const contactData: ContactFormData = {
        HoTen: formData.name.trim(),
        Email: formData.email.trim(),
        SoDienThoai: formData.phone.trim() || undefined,
        ChuDe: formData.subject.trim(),
        NoiDung: formData.message.trim(),
      }

      await contactApi.submit(contactData)

      // Success
      setSubmitted(true)
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
      setFieldErrors({})
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi gửi form. Vui lòng thử lại sau.")
      console.error("Error submitting contact form:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.formWrapper}>
      <h2 className={styles.formTitle}>Gửi Tin Nhắn Cho Chúng Tôi</h2>

      {submitted && (
        <div className={styles.successMessage}>
          ✅ Cảm ơn bạn đã liên hệ! Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong thời gian sớm nhất.
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Họ và tên <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`${styles.input} ${fieldErrors.name ? styles.inputError : ""}`}
            placeholder="Nhập tên của bạn"
            disabled={loading}
          />
          {fieldErrors.name && (
            <span className={styles.fieldError}>{fieldErrors.name}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email <span className={styles.required}>*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ""}`}
            placeholder="Nhập email của bạn"
            disabled={loading}
          />
          {fieldErrors.email && (
            <span className={styles.fieldError}>{fieldErrors.email}</span>
          )}
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
            className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ""}`}
            placeholder="Nhập số điện thoại (tùy chọn)"
            disabled={loading}
          />
          {fieldErrors.phone && (
            <span className={styles.fieldError}>{fieldErrors.phone}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="subject" className={styles.label}>
            Chủ đề <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`${styles.input} ${fieldErrors.subject ? styles.inputError : ""}`}
            placeholder="Chủ đề liên hệ"
            disabled={loading}
          />
          {fieldErrors.subject && (
            <span className={styles.fieldError}>{fieldErrors.subject}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="message" className={styles.label}>
            Tin nhắn <span className={styles.required}>*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            className={`${styles.textarea} ${fieldErrors.message ? styles.inputError : ""}`}
            placeholder="Nhập tin nhắn của bạn (tối thiểu 10 ký tự)"
            disabled={loading}
          ></textarea>
          {fieldErrors.message && (
            <span className={styles.fieldError}>{fieldErrors.message}</span>
          )}
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Đang gửi..." : "Gửi Tin Nhắn"}
        </button>
      </form>
    </div>
  )
}
