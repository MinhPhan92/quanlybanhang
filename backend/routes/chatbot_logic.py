# backend/routes/chatbot_logic.py

import re
import httpx
from typing import Any, Dict, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from fastapi import HTTPException, status
from sqlglot import parse_one, exp

from backend.models import SanPham, DanhMuc, DonHang, DonHang_SanPham, KhachHang, DanhGia
from backend.routes.chatbot_constants import (
    PRODUCT_KEYWORDS, WHITELIST_TABLES_LC, POLICY_SYNONYMS,
    SQL_LLM_URL, SQL_LLM_MODEL, CHAT_LLM_URL, CHAT_LLM_MODEL
)
from backend.routes.chatbot_prompts import TEXT2SQL_PROMPT

# ==========================
# Helper: Thêm URL cho sản phẩm
# ==========================

def add_product_url(row: Dict[str, Any]) -> Dict[str, Any]:
    if "MaSP" in row:
        row["url"] = f"/product/{row['MaSP']}"
    return row

def add_product_urls(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [add_product_url(row) for row in rows]

# ==========================
# Intent Handlers
# ==========================

def intent_top_products_by_rating(db: Session, limit: int = 5, min_reviews: int = 5):
    q = (
        db.query(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
            SanPham.SoLuongTonKho,
            func.avg(DanhGia.DiemDanhGia).label("AvgScore"),
            func.count(DanhGia.MaDanhGia).label("Reviews"),
        )
        .join(DanhGia, DanhGia.MaSP == SanPham.MaSP)
        .filter(SanPham.IsDelete == False)
        .group_by(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
            SanPham.SoLuongTonKho,
        )
        .having(func.count(DanhGia.MaDanhGia) >= min_reviews)
        .order_by(
            func.avg(DanhGia.DiemDanhGia).desc(),
            func.count(DanhGia.MaDanhGia).desc(),
        )
        .limit(limit)
    )
    rows = add_product_urls([dict(r._mapping) for r in q.all()])
    return {
        "mode": "template",
        "intent": "top_products_by_rating",
        "message": f"Top {len(rows)} sản phẩm theo đánh giá (>= {min_reviews} lượt).",
        "rows": rows,
    }

def intent_orders_by_email(db: Session, email: str, limit: int = 5):
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thiếu email khách hàng (params.email).",
        )
    q = (
        db.query(
            DonHang.MaDonHang,
            DonHang.NgayDat,
            DonHang.TongTien,
            DonHang.TrangThai,
        )
        .join(KhachHang, KhachHang.MaKH == DonHang.MaKH)
        .filter(KhachHang.EmailKH == email)
        .order_by(DonHang.NgayDat.desc())
        .limit(limit)
    )
    rows = [dict(r._mapping) for r in q.all()]
    return {
        "mode": "template",
        "intent": "orders_by_email",
        "message": f"Tìm thấy {len(rows)} đơn hàng gần đây của {email}.",
        "rows": rows,
    }

def intent_top_selling_products(db: Session, limit: int = 5):
    rows = (
        db.query(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
            func.sum(DonHang_SanPham.SoLuong).label("TongSoLuongBan"),
        )
        .join(DonHang_SanPham, SanPham.MaSP == DonHang_SanPham.MaSP)
        .filter(SanPham.IsDelete == False)
        .group_by(SanPham.MaSP, SanPham.TenSP, SanPham.GiaSP)
        .order_by(func.sum(DonHang_SanPham.SoLuong).desc())
        .limit(limit)
        .all()
    )
    return {
        "mode": "template",
        "intent": "top_selling_products",
        "message": "Một số sản phẩm bán chạy hiện nay:",
        "rows": add_product_urls([{
            "MaSP": r.MaSP,
            "TenSP": r.TenSP,
            "GiaSP": r.GiaSP,
            "DaBan": int(r.TongSoLuongBan),
        } for r in rows]),
    }

def intent_products_by_keyword_and_price(db: Session, keyword: str, min_price: Optional[int] = None, max_price: Optional[int] = None, limit: int = 5):
    q = (
        db.query(SanPham.MaSP, SanPham.TenSP, SanPham.GiaSP, SanPham.SoLuongTonKho)
        .filter(SanPham.TenSP.ilike(f"%{keyword}%"), SanPham.IsDelete == False)
    )
    if min_price is not None:
        q = q.filter(SanPham.GiaSP >= min_price)
    if max_price is not None:
        q = q.filter(SanPham.GiaSP <= max_price)
    rows = q.order_by(SanPham.GiaSP.asc()).limit(limit).all()
    return {
        "mode": "template",
        "intent": "products_by_keyword_and_price",
        "message": f"Tìm thấy {len(rows)} sản phẩm '{keyword}' theo mức giá.",
        "rows": add_product_urls([dict(r._mapping) for r in rows]),
    }

def intent_products_by_keyword(db: Session, keyword: str, limit: int = 5):
    rows = (
        db.query(SanPham.MaSP, SanPham.TenSP, SanPham.GiaSP, SanPham.SoLuongTonKho)
        .filter(SanPham.TenSP.ilike(f"%{keyword}%"), SanPham.IsDelete == False)
        .order_by(SanPham.GiaSP.asc())
        .limit(limit)
        .all()
    )
    return {
        "mode": "template",
        "intent": "products_by_keyword",
        "message": f"Tìm thấy {len(rows)} sản phẩm '{keyword}'.",
        "rows": add_product_urls([dict(r._mapping) for r in rows]),
    }

# ==========================
# Detection Logic
# ==========================

def extract_product_keyword(question: str) -> Optional[str]:
    for key, variants in PRODUCT_KEYWORDS.items():
        for variant in variants:
            if variant in question:
                return key
    return None

def extract_price_range(question: str) -> Tuple[Optional[int], Optional[int]]:
    q = question.lower()
    m_under = re.search(r"dưới\s*(\d+)\s*triệu", q)
    if m_under:
        return None, int(m_under.group(1)) * 1_000_000
    m_between = re.search(r"từ\s*(\d+)\s*đến\s*(\d+)\s*triệu", q)
    if m_between:
        return int(m_between.group(1)) * 1_000_000, int(m_between.group(2)) * 1_000_000
    return None, None

def extract_email(question: str) -> Optional[str]:
    m = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", question)
    return m.group(0) if m else None

def detect_intent(question: str) -> Dict[str, object]:
    q = question.lower()
    keyword = extract_product_keyword(q)
    min_price, max_price = extract_price_range(q)
    email = extract_email(q)

    if email and any(k in q for k in ["đơn", "đặt", "mua"]):
        return {"intent": "orders_by_customer_email", "email": email}
    if any(k in q for k in ["top", "đánh giá cao", "review tốt"]):
        return {"intent": "top_products_by_rating"}
    if any(k in q for k in ["bán chạy", "mua nhiều", "nhiều người mua", "hot nhất"]):
        return {"intent": "top_selling_products"}
    if keyword and (min_price is not None or max_price is not None):
        return {"intent": "products_by_keyword_and_price", "keyword": keyword, "min_price": min_price, "max_price": max_price}
    if keyword:
        return {"intent": "products_by_keyword", "keyword": keyword}
    return {"intent": "unknown"}

def detect_policy_key(question: str) -> Optional[str]:
    q = question.lower()
    for key, synonyms in POLICY_SYNONYMS.items():
        if any(syn in q for syn in synonyms):
            return key
    return None

def is_internal_data_question(question: str) -> bool:
    q = question.lower()
    keywords = ["doanh thu", "thống kê", "tồn kho", "bao nhiêu đơn", "số lượng bán"]
    return any(k in q for k in keywords)

def is_policy_question(question: str) -> bool:
    """
    Phát hiện câu hỏi VỀ CHÍNH SÁCH (TIER 2)
    
    PHẢI THỎA:
    - Có keyword policy (chính sách, quy định, điều kiện)
    - HOẶC: Có policy-related keyword + Không có query verb
    
    TRÁNH FALSE POSITIVE:
    - "tìm sản phẩm có bảo hành tốt" → FALSE (đây là data query)
    - "sản phẩm nào có thời gian bảo hành lâu?" → FALSE (đây là data query)
    - "chính sách bảo hành?" → TRUE ✅
    - "đổi trả như thế nào?" → TRUE ✅
    """
    q = question.lower()
    
    # === BLACKLIST: Data query indicators ===
    # Nếu có động từ truy vấn mạnh → Không phải policy question
    data_query_verbs = ["tìm", "xem", "show", "hiển thị", "liệt kê", "có những", "có gì", "gợi ý", "cho tôi", "nào"]
    if any(verb in q for verb in data_query_verbs):
        return False
    
    # === WHITELIST: Policy indicators ===
    # 1. Explicit policy keywords
    explicit_policy = ["chính sách", "quy định", "điều kiện", "thủ tục"]
    if any(kw in q for kw in explicit_policy):
        return True
    
    # 2. Policy-related keywords WITHOUT data query context
    # Ví dụ: "bảo hành như thế nào?" ✅ vs "tìm sp có bảo hành" ❌
    policy_keywords = ["bảo hành", "hỏng", "lỗi", "sửa", "đổi", "trả", "hoàn", "ship", "giao", "vận chuyển", "thanh toán", "cod"]
    question_indicators = ["như thế nào", "thế nào", "ra sao", "?", "được không", "có không", "bao lâu", "mất bao lâu"]
    
    has_policy_keyword = any(kw in q for kw in policy_keywords)
    has_question_indicator = any(qi in q for qi in question_indicators)
    
    # Cả 2 điều kiện phải thỏa
    if has_policy_keyword and has_question_indicator:
        return True
    
    return False

# ==========================
# SQL & LLM Processing
# ==========================

def clean_sql_response(raw: str) -> str:
    sql = raw.strip()
    if sql.startswith("```"):
        sql = sql.strip("`")
        if sql.lower().startswith("sql"):
            sql = sql[3:].strip()
    if ";" in sql:
        sql = sql.split(";", 1)[0]
    return sql.strip()

def generate_sql_with_llm(question: str) -> str:
    if not SQL_LLM_URL or not SQL_LLM_MODEL:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Chưa cấu hình SQL_LLM_URL hoặc SQL_LLM_MODEL.")
    payload = {"model": SQL_LLM_MODEL, "prompt": TEXT2SQL_PROMPT.format(question=question), "stream": False}
    try:
        timeout = httpx.Timeout(connect=10.0, read=180.0, write=30.0, pool=10.0)
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(f"{SQL_LLM_URL}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw = data.get("response", "")
            sql = clean_sql_response(raw)
            if not re.search(r'\blimit\b', sql.lower()):
                sql = sql.strip() + " LIMIT 5"
            return sql
    except httpx.ConnectError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Không thể kết nối đến SQL LLM server tại {SQL_LLM_URL}. Vui lòng kiểm tra server Ollama.")
    except httpx.TimeoutException as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=f"SQL LLM server không phản hồi (timeout). Truy vấn SQL có thể quá phức tạp.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Lỗi gọi SQL LLM (Ollama): {e}")

def is_safe_sql(sql: str) -> bool:
    sql_clean = sql.strip()
    if ";" in sql_clean: return False
    low = sql_clean.lower()
    if any(b in low for b in ["insert", "update", "delete", "alter", "drop", "create", "truncate"]): return False
    if not low.startswith("select"): return False
    try:
        ast = parse_one(sql_clean, read="mysql")
    except: return False
    for tbl in ast.find_all(exp.Table):
        if not tbl.name or tbl.name.lower() not in WHITELIST_TABLES_LC: return False
    limit_nodes = list(ast.find_all(exp.Limit))
    if not limit_nodes: return False
    for node in limit_nodes:
        try:
            if int(node.expression.this) > 100: return False
        except: return False
    return True

def execute_raw_sql(db: Session, sql: str) -> List[Dict[str, Any]]:
    result = db.execute(text(sql))
    return [dict(r._mapping) for r in result]

# ==========================
# Chat LLM Interaction
# ==========================

def normalize_lmstudio_messages(messages: list) -> list:
    normalized = []
    for m in messages:
        content = m.get("content")
        if isinstance(content, str):
            normalized.append({"role": m["role"], "content": [{"type": "text", "text": content}]})
        else:
            normalized.append(m)
    return normalized

def extract_lmstudio_text(message: dict) -> str:
    content = message.get("content")
    if isinstance(content, str): return content.strip()
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                return item.get("text", "").strip()
    return ""

def generate_chat_with_llm(messages: list) -> str:
    if not CHAT_LLM_URL or not CHAT_LLM_MODEL:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Chưa cấu hình CHAT_LLM_URL hoặc CHAT_LLM_MODEL.")
    
    # Build prompt from messages for Ollama
    prompt_parts = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "system":
            prompt_parts.append(f"System: {content}")
        elif role == "user":
            prompt_parts.append(f"User: {content}")
        elif role == "assistant":
            prompt_parts.append(f"Assistant: {content}")
    
    prompt_parts.append("Assistant:")
    full_prompt = "\n\n".join(prompt_parts)
    
    # Ollama API format
    payload = {
        "model": CHAT_LLM_MODEL,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.5,
            "num_predict": 200
        }
    }
    
    try:
        timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=10.0)
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(f"{CHAT_LLM_URL}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            response_text = data.get("response", "").strip()
            return response_text
    except httpx.ConnectError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Không thể kết nối đến Chat LLM server tại {CHAT_LLM_URL}. Vui lòng kiểm tra server Ollama.")
    except httpx.TimeoutException as e:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=f"Chat LLM server không phản hồi (timeout). Server có thể đang quá tải.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Lỗi gọi Chat LLM (Ollama): {e}")
