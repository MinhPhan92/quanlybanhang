"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { UserCog } from "lucide-react";
import styles from "./employees.module.css";

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user?.role !== "Admin") {
      router.push("/admin/dashboard");
    }
  }, [user, isLoading, router]);

  if (user?.role !== "Admin") {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý tài khoản nhân viên</h1>
        <p className={styles.subtitle}>Chỉ dành cho Admin</p>
      </div>

      <div className={styles.emptyState}>
        <UserCog size={48} />
        <p>Chức năng quản lý nhân viên sẽ được triển khai sau</p>
      </div>
    </div>
  );
}

