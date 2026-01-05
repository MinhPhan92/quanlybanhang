"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { chatbotApi, ChatResponse } from "@/app/lib/api/chatbot";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  mode?: "chat" | "error" | "llm_sql" | "template";
  source?: "general" | "policy" | "fallback";
  rows?: any[];
}

interface ChatContextType {
  messages: Message[];
  isOpen: boolean;
  isTyping: boolean;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  sessionId: string;
  toggleChat: () => void;
  sendMessage: (question: string) => Promise<void>;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "chat_session_id";
const MESSAGES_KEY = "chat_messages";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");

  // Initialize session ID on mount
  useEffect(() => {
    let sid = localStorage.getItem(STORAGE_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, sid);
    }
    setSessionId(sid);

    // Load messages from localStorage (optional)
    try {
      const savedMessages = localStorage.getItem(MESSAGES_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save messages:", e);
      }
    }
  }, [messages]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    setError(null);
  }, []);

  const addMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      setError(null);
      setIsLoading(true);
      setLoadingMessage("Đang phân tích câu hỏi...");

      // Add user message
      addMessage({
        role: "user",
        content: question,
      });

      try {
        setIsTyping(true);

        // Simulate progressive loading
        setTimeout(() => setLoadingMessage("Đang tạo truy vấn..."), 300);
        setTimeout(() => setLoadingMessage("Đang tìm kiếm dữ liệu..."), 800);

        // Call smart chat API (auto-routing between /ask and /chat)
        const response: ChatResponse = await chatbotApi.smartChat(
          question,
          sessionId
        );

        setLoadingMessage("");

        // Add bot response
        addMessage({
          role: "assistant",
          content: response.message,
          mode: response.mode,
          source: response.source,
          rows: response.rows,
        });
      } catch (err: any) {
        console.error("Chat error:", err);
        setLoadingMessage("");

        // Xử lý lỗi kết nối LLM servers
        let errorMessage = "Xin lỗi, mình đang gặp sự cố. Vui lòng thử lại!";

        if (
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("NetworkError") ||
          err.message?.includes("ERR_CONNECTION_REFUSED")
        ) {
          errorMessage =
            "Không thể kết nối đến hệ thống AI. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.";
        } else if (
          err.message?.includes("502") ||
          err.message?.includes("Bad Gateway") ||
          err.message?.includes("timeout")
        ) {
          errorMessage =
            "Hệ thống đang bận hoặc không phản hồi. Vui lòng thử lại sau vài giây.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        addMessage({
          role: "assistant",
          content: errorMessage,
          mode: "error",
        });
      } finally {
        setIsTyping(false);
        setIsLoading(false);
        setLoadingMessage("");
      }
    },
    [sessionId, addMessage]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_KEY);
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    localStorage.setItem(STORAGE_KEY, newSessionId);
    setError(null);
  }, []);

  const value: ChatContextType = {
    messages,
    isOpen,
    isTyping,
    isLoading,
    loadingMessage,
    error,
    sessionId,
    toggleChat,
    sendMessage,
    clearHistory,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
