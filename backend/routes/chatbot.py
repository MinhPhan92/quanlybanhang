# backend/routes/chatbot.py

from typing import Any, Dict, Optional, List
import os
import re
import logging
from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.routes.deps import get_current_user
from backend.routes.chatbot_constants import POLICY_TEMPLATES
from backend.routes.chatbot_prompts import PARAPHRASE_SYSTEM_PROMPT
from backend.routes.chatbot_logic import (
    detect_intent, detect_policy_key, is_internal_data_question, is_policy_question,
    intent_top_products_by_rating, intent_orders_by_email, intent_top_selling_products,
    intent_products_by_keyword_and_price, intent_products_by_keyword,
    generate_sql_with_llm, is_safe_sql, execute_raw_sql, add_product_urls, generate_chat_with_llm
)

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

# Global variable to store chatbot knowledge
CHATBOT_KNOWLEDGE = ""

# In-memory conversation history (session_id -> {messages: [], last_active: datetime})
# Sliding window: Giữ tối đa 5 messages gần nhất
# Session expiry: 30 phút không hoạt động
CONVERSATION_HISTORY: Dict[str, Dict[str, Any]] = {}
MAX_HISTORY_MESSAGES = 5  # Sliding window size
SESSION_EXPIRE_MINUTES = 15 # Session expiry time

def load_chatbot_knowledge():
    """Load chatbot knowledge from the knowledge file."""
    global CHATBOT_KNOWLEDGE
    knowledge_file = os.path.join(os.path.dirname(__file__), "chatbot_knowledge.txt")
    try:
        with open(knowledge_file, "r", encoding="utf-8") as f:
            CHATBOT_KNOWLEDGE = f.read()
        logging.info(f"✅ Chatbot knowledge loaded from {knowledge_file}")
    except FileNotFoundError:
        logging.warning(f"⚠️ Chatbot knowledge file not found: {knowledge_file}")
        CHATBOT_KNOWLEDGE = ""
    except Exception as e:
        logging.error(f"❌ Error loading chatbot knowledge: {e}")
        CHATBOT_KNOWLEDGE = ""

def get_chatbot_knowledge() -> str:
    """Get the loaded chatbot knowledge."""
    return CHATBOT_KNOWLEDGE

def cleanup_expired_sessions():
    """Xóa sessions đã hết hạn."""
    now = datetime.now()
    expired = [sid for sid, data in CONVERSATION_HISTORY.items() 
               if now - data["last_active"] > timedelta(minutes=SESSION_EXPIRE_MINUTES)]
    for sid in expired:
        del CONVERSATION_HISTORY[sid]
    if expired:
        logging.info(f"🧹 Cleaned up {len(expired)} expired chat sessions")

def get_conversation_history(session_id: str) -> List[Dict[str, str]]:
    """Lấy conversation history của session."""
    cleanup_expired_sessions()  # Cleanup khi lấy history
    if session_id not in CONVERSATION_HISTORY:
        CONVERSATION_HISTORY[session_id] = {
            "messages": [],
            "last_active": datetime.now()
        }
    return CONVERSATION_HISTORY[session_id]["messages"]

def add_to_conversation_history(session_id: str, role: str, content: str):
    """Thêm message vào history với sliding window."""
    if session_id not in CONVERSATION_HISTORY:
        CONVERSATION_HISTORY[session_id] = {
            "messages": [],
            "last_active": datetime.now()
        }
    
    CONVERSATION_HISTORY[session_id]["messages"].append({
        "role": role,
        "content": content
    })
    
    # Sliding window: Giữ tối đa MAX_HISTORY_MESSAGES
    if len(CONVERSATION_HISTORY[session_id]["messages"]) > MAX_HISTORY_MESSAGES:
        CONVERSATION_HISTORY[session_id]["messages"] = \
            CONVERSATION_HISTORY[session_id]["messages"][-MAX_HISTORY_MESSAGES:]
    
    # Update last active time
    CONVERSATION_HISTORY[session_id]["last_active"] = datetime.now()

class ChatRequest(BaseModel):
    question: str
    params: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None  # ID session để track conversation

@router.post("/ask")
def ask_chatbot(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    [DEPRECATED] Endpoint này giữ lại để tương thích ngược.
    Nên dùng /chat - endpoint thông minh tự động phân loại.
    
    Chatbot cho TRUY VẤN DỮ LIỆU (SQL).
    """
    logging.warning("⚠️ /ask endpoint is deprecated. Use /chat instead.")
    
    try:
        intent_data = detect_intent(req.question)

        # Phase 1: Rule-based
        try:
            if intent_data["intent"] == "top_products_by_rating":
                return intent_top_products_by_rating(db)
            elif intent_data["intent"] == "orders_by_customer_email":
                return intent_orders_by_email(db, email=intent_data["email"])
            elif intent_data["intent"] == "products_by_keyword_and_price":
                return intent_products_by_keyword_and_price(db, keyword=intent_data["keyword"], min_price=intent_data["min_price"], max_price=intent_data["max_price"])
            elif intent_data["intent"] == "products_by_keyword":
                return intent_products_by_keyword(db, keyword=intent_data["keyword"])
            elif intent_data["intent"] == "top_selling_products":
                return intent_top_selling_products(db)
        except Exception as e:
            logging.error(f"❌ Rule-based intent error: {e}")
            pass

        # Phase 2: LLM SQL
        try:
            sql = generate_sql_with_llm(req.question)
            if not is_safe_sql(sql):
                return {
                    "mode": "error",
                    "message": "Mình hiểu câu hỏi của bạn rồi, nhưng không thể tìm kiếm thông tin này. Bạn có thể thử hỏi cách khác không ạ?"
                }

            rows = add_product_urls(execute_raw_sql(db, sql))
            return {"mode": "llm_sql", "intent": None, "message": "Tìm thấy kết quả.", "sql": sql, "rows": rows}
        except HTTPException as he:
            logging.error(f"❌ LLM SQL generation error: {he.detail}")
            return {
                "mode": "error",
                "message": "Mình đang gặp chút vấn đề kỹ thuật. Bạn có thể thử lại sau ít phút hoặc hỏi về chính sách của hàng nhé."
            }
        except Exception as e:
            logging.error(f"❌ SQL execution error: {e}")
            return {
                "mode": "error",
                "message": "Không tìm thấy thông tin phù hợp. Bạn có thể hỏi thêm về sản phẩm hoặc chính sách của hàng không ạ?"
            }
    except Exception as e:
        logging.error(f"❌ Unexpected error in /ask: {e}")
        return {
            "mode": "error",
            "message": "Xin lỗi, mình đang gặp sự cố. Bạn vui lòng thử lại sau nhé!"
        }

def is_data_query(question: str) -> bool:
    """
    Phát hiện câu hỏi về truy vấn dữ liệu (SQL query).
    
    STRICT RULES:
    - Chỉ return True khi câu hỏi CẦN truy vấn database
    - Câu hỏi về chính sách/tư vấn → False
    - Câu hỏi chào hỏi/cảm ơn → False
    """
    q = question.lower()
    
    # BLACKLIST - Chắc chắn KHÔNG phải data query
    policy_indicators = [
        "chính sách", "policy", "bảo hành", "đổi trả", "vận chuyển", "thanh toán",
        "ship", "cod", "hoàn tiền", "warranty", "refund", "delivery"
    ]
    greeting_indicators = [
        "xin chào", "chào", "hello", "hi", "cảm ơn", "thank"
    ]
    
    # Nếu có từ khóa policy hoặc greeting → KHÔNG phải data query
    if any(kw in q for kw in policy_indicators + greeting_indicators):
        return False
    
    # WHITELIST - Chắc chắn LÀ data query
    
    # 1. Email trong câu hỏi → Query đơn hàng
    if re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", q):
        return True
    
    # 2. Các động từ truy vấn mạnh + danh từ dữ liệu
    strong_query_verbs = ["tìm", "tìm kiếm", "xem", "cho tôi", "show", "list", "liệt kê"]
    data_nouns = ["sản phẩm", "product", "đơn hàng", "order", "danh sách"]
    
    has_query_verb = any(verb in q for verb in strong_query_verbs)
    has_data_noun = any(noun in q for noun in data_nouns)
    
    if has_query_verb and has_data_noun:
        return True
    
    # 3. Câu hỏi về giá cụ thể với số tiền
    price_patterns = [
        r"dưới\s+\d+\s*(triệu|tr|k|nghìn)",
        r"từ\s+\d+\s*đến\s+\d+\s*(triệu|tr|k)",
        r"giá\s+\d+",
        r"khoảng\s+\d+\s*(triệu|tr)"
    ]
    if any(re.search(pattern, q) for pattern in price_patterns):
        return True
    
    # 4. Top/Best queries
    ranking_keywords = ["top", "best", "tốt nhất", "bán chạy", "đánh giá cao", "review tốt"]
    if any(kw in q for kw in ranking_keywords):
        return True
    
    # 5. Các từ khóa truy vấn yếu (cần kết hợp)
    weak_query_keywords = ["có", "gợi ý", "giá", "rẻ", "mắc"]
    product_types = ["nồi", "máy", "quạt", "bàn ủi", "bình"]
    
    has_weak_query = any(kw in q for kw in weak_query_keywords)
    has_product_type = any(ptype in q for ptype in product_types)
    
    if has_weak_query and has_product_type:
        return True
    
    # Default: KHÔNG phải data query
    return False

@router.post("/chat")
def chat_with_bot(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Chatbot thông minh - Tự động phân loại và xử lý:
    1. SQL Queries (truy vấn sản phẩm, đơn hàng)
    2. Policy Questions (chính sách)
    3. General Chat (tư vấn thường)
    """
    
    # === TIER 1: DATA QUERIES (SQL) ===
    # Phát hiện câu hỏi truy vấn dữ liệu trước
    if is_data_query(req.question):
        logging.info(f"🔵 [/chat] TIER 1: SQL Query detected - {req.question[:50]}...")
        try:
            intent_data = detect_intent(req.question)

            # Phase 1: Rule-based intents
            try:
                if intent_data["intent"] == "top_products_by_rating":
                    logging.info("✅ [TIER 1] Rule-based: top_products_by_rating")
                    return intent_top_products_by_rating(db)
                elif intent_data["intent"] == "orders_by_customer_email":
                    logging.info("✅ [TIER 1] Rule-based: orders_by_email")
                    return intent_orders_by_email(db, email=intent_data["email"])
                elif intent_data["intent"] == "products_by_keyword_and_price":
                    logging.info("✅ [TIER 1] Rule-based: products_by_keyword_and_price")
                    return intent_products_by_keyword_and_price(db, keyword=intent_data["keyword"], min_price=intent_data["min_price"], max_price=intent_data["max_price"])
                elif intent_data["intent"] == "products_by_keyword":
                    logging.info("✅ [TIER 1] Rule-based: products_by_keyword")
                    return intent_products_by_keyword(db, keyword=intent_data["keyword"])
                elif intent_data["intent"] == "top_selling_products":
                    logging.info("✅ [TIER 1] Rule-based: top_selling_products")
                    return intent_top_selling_products(db)
            except Exception as e:
                logging.error(f"❌ [TIER 1] Rule-based error: {e}")
                # Fallback to LLM SQL
                pass

            # Phase 2: LLM SQL Generation
            try:
                logging.info("🤖 [TIER 1] LLM SQL generation...")
                sql = generate_sql_with_llm(req.question)
                if not is_safe_sql(sql):
                    logging.warning("⚠️ [TIER 1] Unsafe SQL detected")
                    return {
                        "mode": "error",
                        "tier": "tier_1_sql",
                        "message": "Mình hiểu câu hỏi của bạn rồi, nhưng không thể tìm kiếm thông tin này. Bạn có thể thử hỏi cách khác không ạ?"
                    }

                rows = add_product_urls(execute_raw_sql(db, sql))
                logging.info(f"✅ [TIER 1] SQL executed successfully, {len(rows)} rows returned")
                return {"mode": "llm_sql", "tier": "tier_1_sql", "intent": None, "message": "Tìm thấy kết quả.", "sql": sql, "rows": rows}
            except HTTPException as he:
                logging.error(f"❌ [TIER 1] LLM SQL generation error: {he.detail}")
                return {
                    "mode": "error",
                    "tier": "tier_1_sql",
                    "message": "Mình đang gặp chút vấn đề kỹ thuật. Bạn có thể thử lại sau ít phút hoặc hỏi về chính sách của hàng nhé."
                }
            except Exception as e:
                logging.error(f"❌ [TIER 1] SQL execution error: {e}")
                return {
                    "mode": "error",
                    "tier": "tier_1_sql",
                    "message": "Không tìm thấy thông tin phù hợp. Bạn có thể hỏi thêm về sản phẩm hoặc chính sách của hàng không ạ?"
                }
        except Exception as e:
            logging.error(f"❌ [TIER 1] Unexpected error in data query: {e}")
            # Fallback to conversation mode
            pass
    
    # === TIER 2: POLICY QUESTIONS ===
    if is_policy_question(req.question):
        logging.info(f"🟣 [/chat] TIER 2: Policy question detected - {req.question[:50]}...")
        policy_key = detect_policy_key(req.question)
        if policy_key:
            logging.info(f"✅ [TIER 2] Policy key: {policy_key}")
            policy_text = POLICY_TEMPLATES[policy_key]
            messages = [
                {"role": "system", "content": PARAPHRASE_SYSTEM_PROMPT},
                {"role": "user", "content": f"Đoạn văn:\n{policy_text}"},
            ]
            try:
                paraphrased = generate_chat_with_llm(messages)
                banned = ["chào", "cảm ơn", "xin lỗi", "xin chào", "hi ", "hello", "vâng"]
                if paraphrased and len(paraphrased) <= len(policy_text) * 1.5 and not any(b in paraphrased.lower() for b in banned):
                    policy_text = paraphrased
                    logging.info("✅ [TIER 2] Policy paraphrased by LLM")
            except Exception as e:
                logging.warning(f"⚠️ [TIER 2] Paraphrase failed, using original policy: {e}")
                pass
            return {"mode": "chat", "tier": "tier_2_policy", "source": "policy", "message": policy_text, "session_id": req.session_id}
        
        logging.info("⚠️ [TIER 2] Policy question but no specific key detected")
        return {"mode": "chat", "tier": "tier_2_policy", "source": "policy", "message": "Dạ, hiện tại cửa hàng có các chính sách về Bảo hành, Đổi trả, Vận chuyển và Thanh toán. Bạn đang quan tâm đến phần nào ạ?", "session_id": req.session_id}

    # === TIER 3: GENERAL CHAT ===
    # Chặn câu hỏi dữ liệu nội bộ nhạy cảm
    if is_internal_data_question(req.question):
        return {"mode": "chat", "message": "Mình chỉ có thể hỗ trợ tư vấn sản phẩm. Bạn có thể hỏi về giá cả hoặc gợi ý sản phẩm nhé.", "session_id": req.session_id}
    
    try:
        system_prompt = """Bạn là chatbot tư vấn đồ gia dụng, nói tiếng Việt thân thiện.

CHÍNH SÁCH:
- Bảo hành: 12 tháng
- Đổi trả: 30 ngày (còn nguyên tem, chưa dùng)
- Ship: 3 tốc độ, miễn phí 10 triệu+
- Thanh toán: COD, thẻ, chuyển khoản

VAI TRÒ:
- Tư vấn sản phẩm phù hợp nhu cầu
- Gợi ý đồ gia dụng cho chuyển trọ, tân gia
- Trả lời ngắn gọn, 3-4 câu
- Nếu hỏi giá/chi tiết sản phẩm cụ thể, gợi ý: 'Bạn hỏi: tìm [tên sp]'"""
        
        # Build messages với history
        messages = [{"role": "system", "content": system_prompt}]
        
        if req.session_id:
            try:
                history = get_conversation_history(req.session_id)
                messages.extend(history)
            except Exception as e:
                logging.warning(f"⚠️ Failed to load history for session {req.session_id}: {e}")
                pass
        
        messages.append({"role": "user", "content": req.question})
        
        # Generate response
        try:
            response = generate_chat_with_llm(messages)
            
            # Validate response
            if not response or len(response.strip()) < 5:
                logging.warning(f"⚠️ [TIER 3] Empty or too short response from LLM")
                raise Exception("Response too short")
                
        except HTTPException as he:
            logging.error(f"❌ LLM chat error: {he.detail}")
            return {
                "mode": "chat",
                "source": "fallback",
                "message": "Mình hiện đang quá tải, không thể trả lời ngay. Bạn có thể liên hệ hotline 03122454563 để được hỗ trợ trực tiếp nhé!",
                "session_id": req.session_id
            }
        except Exception as e:
            logging.error(f"❌ Unexpected chat error: {e}")
            return {
                "mode": "chat",
                "source": "fallback",
                "message": "Xin lỗi, mình chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về chính sách bảo hành, đổi trả, vận chuyển hoặc thanh toán không ạ?",
                "session_id": req.session_id
            }
        
        logging.info(f"✅ [TIER 3] General chat response generated: {response[:100]}...")
        
        # Lưu history
        if req.session_id:
            try:
                add_to_conversation_history(req.session_id, "user", req.question)
                add_to_conversation_history(req.session_id, "assistant", response)
            except Exception as e:
                logging.warning(f"⚠️ Failed to save history for session {req.session_id}: {e}")
                pass
        
        return {"mode": "chat", "source": "general", "message": response, "session_id": req.session_id}
    
    except Exception as e:
        logging.error(f"❌ Critical error in general chat: {e}")
        return {
            "mode": "chat",
            "source": "fallback",
            "message": "Mình xin lỗi vì sự cố kỹ thuật. Bạn có thể gọi hotline 03122454563 để được tư vấn trực tiếp nhé!",
            "session_id": req.session_id
        }
