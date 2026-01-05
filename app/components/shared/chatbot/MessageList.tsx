"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useChat } from "@/app/contexts/ChatContext";
import { Bot, User, Package, ShoppingCart } from "lucide-react";
import styles from "./chatbot.module.css";

const QUICK_REPLIES = [
  "📦 Xem sản phẩm bán chạy",
  "🔍 Tìm nồi chiên không dầu",
  "⭐ Sản phẩm đánh giá cao",
  "💰 Chính sách đổi trả",
  "🚚 Chính sách vận chuyển",
  "🔧 Chính sách bảo hành",
];

export default function MessageList() {
  const { messages, isTyping, loadingMessage, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleQuickReply = (text: string) => {
    // Remove emoji and send
    const cleanText = text.replace(/[📦🔍⭐💰🚚🔧]/g, "").trim();
    sendMessage(cleanText);
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className={styles.messageList}>
      {messages.length === 0 && (
        <div className={styles.welcomeMessage}>
          <Bot size={48} className={styles.welcomeIcon} />
          <h3>Xin chào! 👋</h3>
          <p>Mình có thể giúp gì cho bạn?</p>
          <div className={styles.suggestions}>
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                className={styles.suggestionButton}
                onClick={() => handleQuickReply(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.messageItem} ${
            message.role === "user" ? styles.userMessage : styles.botMessage
          }`}
        >
          <div className={styles.messageAvatar}>
            {message.role === "user" ? <User size={20} /> : <Bot size={20} />}
          </div>
          <div className={styles.messageContent}>
            <div className={styles.messageText}>
              {message.source === "policy"
                ? message.content
                    .split(/(?=\s*[-•]\s)|(?=\s*\d+[.)]\s)/)
                    .map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      return <div key={idx}>{trimmed}</div>;
                    })
                : message.content}
            </div>

            <div className={styles.messageTime}>
              {formatTime(message.timestamp)}
            </div>

            {/* Render SQL results if available */}
            {message.rows && message.rows.length > 0 && (
              <div className={styles.sqlResults}>
                <div className={styles.resultsHeader}>
                  <Package size={14} />
                  Kết quả ({message.rows.length}):
                </div>
                <div className={styles.resultsList}>
                  {message.rows.slice(0, 5).map((row: any, idx: number) => {
                    // Check if this is a product row (has MaSP)
                    const isProduct = row.MaSP || row.url;
                    const productUrl =
                      row.url || (row.MaSP ? `/product/${row.MaSP}` : null);

                    if (isProduct && productUrl) {
                      return (
                        <Link
                          key={idx}
                          href={productUrl}
                          className={styles.productCard}
                          target="_blank"
                        >
                          <div className={styles.productCardContent}>
                            <div className={styles.productCardIcon}>
                              <Package size={20} />
                            </div>
                            <div className={styles.productCardInfo}>
                              {row.TenSP && (
                                <div className={styles.productName}>
                                  {row.TenSP}
                                </div>
                              )}
                              {row.GiaSP && (
                                <div className={styles.productPrice}>
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  }).format(row.GiaSP)}
                                </div>
                              )}
                              {row.SoLuongTonKho !== undefined && (
                                <div className={styles.productStock}>
                                  Còn: {row.SoLuongTonKho} sản phẩm
                                </div>
                              )}
                              {row.DiemTrungBinh !== undefined && (
                                <div className={styles.productStock}>
                                  ⭐ {row.DiemTrungBinh.toFixed(1)} (
                                  {row.SoLuongDanhGia} đánh giá)
                                </div>
                              )}
                            </div>
                            <div className={styles.productCardAction}>
                              <ShoppingCart size={16} />
                            </div>
                          </div>
                        </Link>
                      );
                    }

                    // Non-product results (orders, stats, etc.)
                    return (
                      <div key={idx} className={styles.resultItem}>
                        {Object.entries(row).map(
                          ([key, value]: [string, any]) => (
                            <div key={key} className={styles.resultField}>
                              <span className={styles.resultFieldLabel}>
                                {key}:
                              </span>
                              <span className={styles.resultFieldValue}>
                                {typeof value === "number" &&
                                key.includes("Gia")
                                  ? new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(value)
                                  : String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className={`${styles.messageItem} ${styles.botMessage}`}>
          <div className={styles.messageAvatar}>
            <Bot size={20} />
          </div>
          <div className={styles.messageContent}>
            {loadingMessage && (
              <div className={styles.loadingMessage}>{loadingMessage}</div>
            )}
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
