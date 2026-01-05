"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { useChat } from "@/app/contexts/ChatContext";
import styles from "./chatbot.module.css";

export default function MessageInput() {
  const { sendMessage, isLoading, isTyping } = useChat();
  const [input, setInput] = useState("");

  const handleSubmit = async () => {
    if (!input.trim() || isLoading || isTyping) return;

    const question = input.trim();
    setInput("");
    await sendMessage(question);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.messageInput}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập câu hỏi của bạn..."
        disabled={isLoading || isTyping}
        className={styles.input}
      />
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || isLoading || isTyping}
        className={styles.sendButton}
        aria-label="Gửi tin nhắn"
      >
        <Send size={20} />
      </button>
    </div>
  );
}
