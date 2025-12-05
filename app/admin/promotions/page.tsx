"use client";

import { useState } from "react";
import { Tag, Plus } from "lucide-react";
import styles from "./promotions.module.css";

export default function PromotionsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý khuyến mãi</h1>
          <p className={styles.subtitle}>Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <button className={styles.addButton}>
          <Plus size={20} />
          Tạo khuyến mãi mới
        </button>
      </div>

      <div className={styles.emptyState}>
        <Tag size={48} />
        <p>Chức năng quản lý khuyến mãi sẽ được triển khai sau</p>
      </div>
    </div>
  );
}

