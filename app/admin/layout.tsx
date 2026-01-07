"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Tag,
  FileText,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  BarChart3,
  Warehouse,
} from "lucide-react";
import styles from "./admin-layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push("/login");
      return;
    }

    // Allow Admin, Manager, Employee, and NhanVien roles
    const allowedRoles = ["Admin", "Manager", "Employee", "NhanVien"];
    if (user && !allowedRoles.includes(user.role || "")) {
      router.push("/");
      return;
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Allow Admin, Manager, Employee, and NhanVien roles
  const allowedRoles = ["Admin", "Manager", "Employee", "NhanVien"];
  if (!allowedRoles.includes(user.role || "")) {
    return null;
  }

  const isAdminOnly = user.role === "Admin";

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin/dashboard",
      roles: ["Admin", "Manager", "Employee", "NhanVien"],
    },
    {
      icon: Package,
      label: "Sản phẩm",
      href: "/admin/products",
      roles: ["Admin", "Manager", "Employee", "NhanVien"],
    },
    {
      icon: Tag,
      label: "Danh mục",
      href: "/admin/categories",
      roles: ["Admin", "Manager", "Employee", "NhanVien"],
    },
    {
      icon: Warehouse,
      label: "Tồn kho",
      href: "/admin/inventory",
      roles: ["Admin", "Manager"],
    },
    {
      icon: ShoppingCart,
      label: "Đơn hàng",
      href: "/admin/orders",
      roles: ["Admin", "Manager", "Employee", "NhanVien"],
    },
    {
      icon: BarChart3,
      label: "Báo cáo",
      href: "/admin/reports",
      roles: ["Admin", "Manager"],
    },
    {
      icon: Users,
      label: "Khách hàng",
      href: "/admin/customers",
      roles: ["Admin", "Manager", "Employee", "NhanVien"],
    },
    {
      icon: MessageSquare,
      label: "Phản hồi & Khiếu nại",
      href: "/admin/feedback",
      roles: ["Admin", "Manager", "Employee", "NhanVien"],
    },
    {
      icon: Tag,
      label: "Khuyến mãi",
      href: "/admin/promotions",
      roles: ["Admin", "Manager", "Employee", "NhanVien"],
    },
    {
      icon: FileText,
      label: "Nhật ký hệ thống",
      href: "/admin/logs",
      roles: ["Admin", "Manager"],
    },
    {
      icon: UserCog,
      label: "Quản lý nhân viên",
      href: "/admin/employees",
      roles: ["Admin"],
    },
  ].filter((item) => item.roles.includes(user.role || ""));

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>Admin Panel</h2>
          <button
            className={styles.toggleButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            {sidebarOpen && (
              <>
                <p className={styles.userName}>{user.username}</p>
                <p className={styles.userRole}>{user.role}</p>
              </>
            )}
          </div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {!sidebarOpen && (
          <button
            className={styles.mobileMenuButton}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        )}
        <div className={styles.content}>{children}</div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

