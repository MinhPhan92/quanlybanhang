# backend/routes/chatbot.py

from typing import Any, Dict, Optional, List
import os
import logging

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

class ChatRequest(BaseModel):
    question: str
    params: Optional[Dict[str, Any]] = None

@router.post("/ask")
def ask_chatbot(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Chatbot cho TRUY VẤN DỮ LIỆU (SQL)."""
    intent_data = detect_intent(req.question)

    # Phase 1: Rule-based
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

    # Phase 2: LLM SQL
    sql = generate_sql_with_llm(req.question)
    if not is_safe_sql(sql):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Truy vấn không an toàn:\n{sql}")

    rows = add_product_urls(execute_raw_sql(db, sql))
    return {"mode": "llm_sql", "intent": None, "message": "Truy vấn từ LLM (đã kiểm duyệt).", "sql": sql, "rows": rows}

@router.post("/chat")
def chat_with_bot(
    req: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Chatbot hội thoại (Policy + General)."""
    # 1. Chặn câu hỏi dữ liệu nội bộ
    if is_internal_data_question(req.question):
        return {"mode": "chat", "message": "Mình chỉ có thể hỗ trợ tư vấn sản phẩm. Bạn có thể hỏi về giá cả hoặc gợi ý sản phẩm nhé."}

    # 2. POLICY HYBRID
    if is_policy_question(req.question):
        policy_key = detect_policy_key(req.question)
        if policy_key:
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
            except: pass
            return {"mode": "chat", "source": "policy", "message": policy_text}
        
        return {"mode": "chat", "source": "policy", "message": "Dạ, hiện tại cửa hàng có các chính sách về Bảo hành, Đổi trả, Vận chuyển và Thanh toán. Bạn đang quan tâm đến phần nào ạ?"}

    # 3. CHAT THƯỜNG
    messages = [
        {"role": "system", "content": "Bạn là chatbot hỗ trợ khách hàng đồ gia dụng. Nói tiếng Việt thân thiện."},
        {"role": "user", "content": req.question},
    ]
    return {"mode": "chat", "source": "general", "message": generate_chat_with_llm(messages)}
