import apiClient from "../utils/axios";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  question: string;
  session_id?: string;
  params?: Record<string, any>;
}

export interface ChatResponse {
  mode: "chat" | "error" | "llm_sql" | "template";
  source?: "general" | "policy" | "fallback";
  intent?: string;
  message: string;
  session_id?: string;
  sql?: string;
  rows?: any[];
}

export interface AskResponse {
  mode: "template" | "llm_sql" | "error";
  intent?: string;
  message: string;
  sql?: string;
  rows?: any[];
  items?: any[];
}

/**
 * Kiểm tra câu hỏi có phải là data query không
 */
function isDataQuery(question: string): boolean {
  const q = question.toLowerCase();
  
  // Blacklist: Policy/greeting keywords
  const policyIndicators = ["chính sách", "bảo hành", "đổi trả", "vận chuyển", "thanh toán", "ship", "cod"];
  const greetingIndicators = ["xin chào", "chào", "hello", "cảm ơn"];
  
  if (policyIndicators.some(kw => q.includes(kw)) || greetingIndicators.some(kw => q.includes(kw))) {
    return false;
  }
  
  // Whitelist: Data query patterns
  // 1. Email detection
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(q)) {
    return true;
  }
  
  // 2. Strong verbs + data nouns
  const strongVerbs = ["tìm", "xem", "show", "hiển thị", "liệt kê", "cho tôi"];
  const dataNouns = ["sản phẩm", "sp", "đơn hàng", "order"];
  
  if (strongVerbs.some(v => q.includes(v)) && dataNouns.some(n => q.includes(n))) {
    return true;
  }
  
  // 3. Price patterns
  if (/dưới\s+\d+|từ\s+\d+\s+đến|giá\s+\d+/.test(q)) {
    return true;
  }
  
  // 4. Ranking keywords
  const rankingKeywords = ["top", "best", "bán chạy", "đánh giá cao"];
  if (rankingKeywords.some(kw => q.includes(kw))) {
    return true;
  }
  
  // 5. Weak query + product types
  const weakVerbs = ["có", "gợi ý", "giá"];
  const productTypes = ["nồi", "máy", "quạt", "bình"];
  
  if (weakVerbs.some(v => q.includes(v)) && productTypes.some(p => q.includes(p))) {
    return true;
  }
  
  return false;
}

export const chatbotApi = {
  /**
   * Chat endpoint - Conversational chat với policy và general knowledge
   */
  chat: async (question: string, sessionId?: string): Promise<ChatResponse> => {
    return apiClient("/chatbot/chat", {
      method: "POST",
      body: JSON.stringify({
        question,
        session_id: sessionId,
      }),
    });
  },

  /**
   * Ask endpoint - Data queries với SQL generation
   */
  ask: async (question: string, sessionId?: string): Promise<AskResponse> => {
    return apiClient("/chatbot/ask", {
      method: "POST",
      body: JSON.stringify({
        question,
        session_id: sessionId,
      }),
    });
  },

  /**
   * Smart chat - Tự động routing giữa /ask và /chat
   */
  smartChat: async (question: string, sessionId?: string): Promise<ChatResponse | AskResponse> => {
    if (isDataQuery(question)) {
      // Data query -> Gọi /ask
      const askResponse = await chatbotApi.ask(question, sessionId);
      // Convert AskResponse to ChatResponse format
      return {
        mode: askResponse.mode as "llm_sql" | "template" | "error",
        intent: askResponse.intent,
        message: askResponse.message,
        sql: askResponse.sql,
        rows: askResponse.rows,
        session_id: sessionId,
      } as ChatResponse;
    } else {
      // Conversational -> Gọi /chat
      return chatbotApi.chat(question, sessionId);
    }
  },
};
