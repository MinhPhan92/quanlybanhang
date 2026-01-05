"use client";

import { X, Trash2, Bot } from "lucide-react";
import { useChat } from "@/app/contexts/ChatContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import styles from "./chatbot.module.css";

export default function ChatWindow() {
  const { isOpen, toggleChat, clearHistory, messages } = useChat();

  if (!isOpen) return null;

  const handleClearHistory = () => {
    if (confirm("Bạn có chắc muốn xóa lịch sử chat?")) {
      clearHistory();
    }
  };

  return (
    <div className={styles.chatWindow}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <Bot size={24} className={styles.headerIcon} />
          <div>
            <h3 className={styles.headerTitle}>Chat với AI</h3>
            <p className={styles.headerSubtitle}>Hỗ trợ 24/7</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className={styles.headerButton}
              title="Xóa lịch sử"
              aria-label="Xóa lịch sử chat"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={toggleChat}
            className={styles.headerButton}
            title="Đóng"
            aria-label="Đóng chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Input */}
      <MessageInput />
    </div>
  );
}
