"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/app/components/shared/header/Header"
import Footer from "@/app/components/shared/footer/Footer"
import { useAuth } from "@/app/contexts/AuthContext"
import { MapPin, Plus, Edit, Trash2, Check } from "lucide-react"
import styles from "./addresses.module.css"

interface Address {
  id: number
  fullName: string
  phone: string
  address: string
  city: string
  postalCode: string
  isDefault: boolean
}

export default function AddressBookPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    isDefault: false,
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (isAuthenticated) {
      loadAddresses()
    }
  }, [isAuthenticated, isLoading, router])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      // Since the database only has one address per customer (DiaChiKH),
      // we'll load the customer's address and display it as a single address
      const { customerApi } = await import("@/app/lib/api/customer")
      const customerInfo = await customerApi.getMyInfo()
      
      if (customerInfo.DiaChiKH) {
        // Parse address - assuming format: "address, city, postalCode" or just "address"
        const addressParts = customerInfo.DiaChiKH.split(",").map(s => s.trim())
        setAddresses([
          {
            id: 1,
            fullName: customerInfo.TenKH || "",
            phone: customerInfo.SdtKH || "",
            address: addressParts[0] || customerInfo.DiaChiKH,
            city: addressParts[1] || "",
            postalCode: addressParts[2] || "",
            isDefault: true,
          },
        ])
      } else {
        setAddresses([])
      }
    } catch (err: any) {
      console.error("Error loading addresses:", err)
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { customerApi } = await import("@/app/lib/api/customer")
      
      // Combine address parts into DiaChiKH
      const fullAddress = [formData.address, formData.city, formData.postalCode]
        .filter(Boolean)
        .join(", ")
      
      // Update customer info
      await customerApi.updateMyInfo({
        TenKH: formData.fullName,
        SdtKH: formData.phone,
        DiaChiKH: fullAddress,
      })
      
      // Reload addresses
      await loadAddresses()
      setShowAddForm(false)
      setEditingId(null)
      setFormData({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        isDefault: false,
      })
    } catch (err: any) {
      console.error("Error saving address:", err)
      alert(err.message || "Có lỗi xảy ra khi lưu địa chỉ")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return
    try {
      const { customerApi } = await import("@/app/lib/api/customer")
      // Clear address
      await customerApi.updateMyInfo({
        DiaChiKH: "",
      })
      await loadAddresses()
    } catch (err: any) {
      console.error("Error deleting address:", err)
      alert(err.message || "Có lỗi xảy ra khi xóa địa chỉ")
    }
  }

  const handleSetDefault = async (id: number) => {
    // Since we only have one address, this is always the default
    // No action needed
  }

  const startEdit = (address: Address) => {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    })
    setEditingId(address.id)
    setShowAddForm(true)
  }

  if (isLoading || loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <p>Đang tải...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Sổ Địa Chỉ</h1>

          {/* Add New Address Button */}
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} className={styles.addButton}>
              <Plus size={20} />
              Thêm Địa Chỉ Mới
            </button>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>
                {editingId ? "Chỉnh Sửa Địa Chỉ" : "Thêm Địa Chỉ Mới"}
              </h2>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="fullName">Họ và tên *</label>
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="phone">Số điện thoại *</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="address">Địa chỉ *</label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="city">Thành phố *</label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="postalCode">Mã bưu điện</label>
                    <input
                      type="text"
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    />
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    {editingId ? "Cập nhật" : "Thêm địa chỉ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingId(null)
                      setFormData({
                        fullName: "",
                        phone: "",
                        address: "",
                        city: "",
                        postalCode: "",
                        isDefault: false,
                      })
                    }}
                    className={styles.cancelButton}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses List */}
          <div className={styles.addressesList}>
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className={`${styles.addressCard} ${address.isDefault ? styles.default : ""}`}
                >
                  {address.isDefault && (
                    <div className={styles.defaultBadge}>
                      <Check size={16} />
                      Mặc định
                    </div>
                  )}
                  <div className={styles.addressHeader}>
                    <MapPin size={24} className={styles.addressIcon} />
                    <div className={styles.addressInfo}>
                      <h3 className={styles.addressName}>{address.fullName}</h3>
                      <p className={styles.addressPhone}>{address.phone}</p>
                      <p className={styles.addressText}>
                        {address.address}, {address.city}
                        {address.postalCode && `, ${address.postalCode}`}
                      </p>
                    </div>
                  </div>
                  <div className={styles.addressActions}>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className={styles.setDefaultButton}
                      >
                        Đặt làm mặc định
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(address)}
                      className={styles.editButton}
                    >
                      <Edit size={18} />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className={styles.deleteButton}
                    >
                      <Trash2 size={18} />
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyContainer}>
                <MapPin size={48} color="#9ca3af" />
                <h2 className={styles.emptyTitle}>Chưa có địa chỉ nào</h2>
                <p className={styles.emptyText}>
                  Thêm địa chỉ để giao hàng nhanh chóng hơn
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

