"use client"

import Link from "next/link"
import { ShoppingCart, Search, Menu, Shield, LogIn, LogOut, User } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { useCart } from "@/app/contexts/CartContext"
import { useRouter } from "next/navigation"
import styles from "./Header.module.css"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { getTotalItems } = useCart()
  const router = useRouter()
  const isAdmin = user?.role === "Admin" || user?.role === "Manager"
  const cartItemCount = getTotalItems()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSearchClick = () => {
    setShowSearch(!showSearch)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery("")
    }
  }

  const handleCartClick = () => {
    router.push("/cart")
  }

  return (
    <header className={styles.header}>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoBadge}>
              <span className={styles.logoText}>GD</span>
            </div>
            <span className={styles.logoName}>Gia Dụng Plus</span>
          </Link>

          {/* Desktop Menu */}
          <nav className={styles.desktopNav}>
            <Link href="/" className={styles.navLink}>
              Trang chủ
            </Link>
            <Link href="/shop" className={styles.navLink}>
              Sản phẩm
            </Link>
            <Link href="/about" className={styles.navLink}>
              Giới thiệu
            </Link>
            <Link href="/contact" className={styles.navLink}>
              Liên hệ
            </Link>
            <Link href="/policies" className={styles.navLink}>
              Chính sách
            </Link>
            {isAdmin && (
              <Link href="/admin" className={styles.navLink}>
                <Shield size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className={styles.actions}>
            {showSearch ? (
              <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
                <button type="submit" className={styles.searchSubmitButton}>
                  <Search size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
                  }}
                  className={styles.searchCloseButton}
                >
                  ×
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={handleSearchClick}
                className={styles.iconButton}
                title="Tìm kiếm"
              >
                <Search size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCartClick}
              className={styles.cartButton}
              title="Giỏ hàng"
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className={styles.cartBadge}>{cartItemCount}</span>
              )}
            </button>
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <span className={styles.userName}>{user?.username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={styles.logoutButton}
                  title="Đăng xuất"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link href="/login" className={styles.loginButton}>
                <LogIn size={20} />
                <span className={styles.loginText}>Đăng nhập</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={styles.menuButton}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <nav className={styles.mobileNav}>
            <Link href="/" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
              Trang chủ
            </Link>
            <Link href="/shop" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
              Sản phẩm
            </Link>
            <Link href="/about" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
              Giới thiệu
            </Link>
            <Link href="/contact" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
              Liên hệ
            </Link>
            <Link href="/policies" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
              Chính sách
            </Link>
            {isAdmin && (
              <Link href="/admin" className={styles.mobileNavLink}>
                <Shield size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Admin
              </Link>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className={styles.mobileNavLink}
              >
                <LogOut size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Đăng xuất
              </button>
            ) : (
              <Link href="/login" className={styles.mobileNavLink}>
                <LogIn size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Đăng nhập
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
