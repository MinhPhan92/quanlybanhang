"use client"

import Link from "next/link"
import { ShoppingCart, Search, Menu, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { authApi } from "@/app/lib/api/auth"
import styles from "./Header.module.css"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(authApi.isAdmin())
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.wrapper}>
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoBadge}>
              <span className={styles.logoText}>GD</span>
            </div>
            <span className={styles.logoName}>GiaĐụcPlus</span>
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
            <button className={styles.iconButton}>
              <Search size={20} />
            </button>
            <button className={styles.cartButton}>
              <ShoppingCart size={20} />
              <span className={styles.cartBadge}>0</span>
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className={styles.menuButton}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <nav className={styles.mobileNav}>
            <a href="#" className={styles.mobileNavLink}>
              Trang chủ
            </a>
            <a href="#" className={styles.mobileNavLink}>
              Sản phẩm
            </a>
            <a href="#" className={styles.mobileNavLink}>
              Giới thiệu
            </a>
            <a href="#" className={styles.mobileNavLink}>
              Liên hệ
            </a>
            {isAdmin && (
              <Link href="/admin" className={styles.mobileNavLink}>
                <Shield size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Admin
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
