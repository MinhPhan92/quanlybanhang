"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Settings } from "lucide-react";
import styles from "./settings.module.css";

export default function SettingsPage() {
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
        <h1 className={styles.title}>Cấu hình hệ thống</h1>
        <p className={styles.subtitle}>Chỉ dành cho Admin</p>
      </div>

      <div className={styles.emptyState}>
        <Settings size={48} />
        <p>Chức năng cấu hình hệ thống sẽ được triển khai sau</p>
      </div>
    </div>
  );
}

