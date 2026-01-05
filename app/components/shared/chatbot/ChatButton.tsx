"use client";

import { MessageCircle, X } from "lucide-react";
import { useChat } from "@/app/contexts/ChatContext";
import styles from "./chatbot.module.css";

export default function ChatButton() {
  const { isOpen, toggleChat, messages } = useChat();

  // Count unread messages (simple logic: messages since last open)
  const hasNewMessages = messages.length > 0 && !isOpen;

  return (
    <button
      onClick={toggleChat}
      className={`${styles.chatButton} ${
        hasNewMessages ? styles.hasNotification : ""
      }`}
      title={isOpen ? "Đóng chat" : "Chat với AI"}
      aria-label={isOpen ? "Đóng chat" : "Mở chat"}
    >
      {isOpen ? (
        <X size={24} className={styles.buttonIcon} />
      ) : (
        <>
          <MessageCircle size={24} className={styles.buttonIcon} />
          {hasNewMessages && <span className={styles.notificationDot} />}
        </>
      )}
    </button>
  );
}
