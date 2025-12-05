"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import styles from "./feedback.module.css";

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<"reviews" | "complaints">("reviews");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API calls for reviews and complaints
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Phản hồi & Khiếu nại</h1>
        <p className={styles.subtitle}>Quản lý đánh giá và khiếu nại từ khách hàng</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "reviews" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          <MessageSquare size={20} />
          Đánh giá sản phẩm
        </button>
        <button
          className={`${styles.tab} ${activeTab === "complaints" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("complaints")}
        >
          <MessageSquare size={20} />
          Khiếu nại
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      ) : (
        <div className={styles.content}>
          {activeTab === "reviews" ? (
            <div className={styles.emptyState}>
              <MessageSquare size={48} />
              <p>Chức năng đánh giá sẽ được triển khai sau</p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <MessageSquare size={48} />
              <p>Chức năng khiếu nại sẽ được triển khai sau</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

