"use client";

import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";
import styles from "./chatbot.module.css";

export default function ChatWidget() {
  return (
    <div className={styles.chatWidget}>
      <ChatButton />
      <ChatWindow />
    </div>
  );
}
