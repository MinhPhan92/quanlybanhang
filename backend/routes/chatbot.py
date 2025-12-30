# backend/routes/chatbot.py

from typing import Any, Dict, Optional, List,Tuple
import os
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, func

import httpx
from sqlglot import parse_one, exp

from backend.database import get_db
from backend.routes.deps import get_current_user
from backend.models import (
    SanPham,
    DanhMuc,
    DonHang,
    DonHang_SanPham,
    KhachHang,
    DanhGia,
)

"""
Body:
{
  "username": "0912345678",
  "password": "customer123"
}
"""


"""
Cấu hình .env gợi ý:

# LLM cho Text-to-SQL (Ollama + Qwen2.5-Coder:3b)
SQL_LLM_URL=http://localhost:11434
SQL_LLM_MODEL=qwen2.5-coder:3b

# LLM cho chat tiếng Việt (PhoGPT qua LM Studio / OpenAI-compatible API)
CHAT_LLM_URL=http://localhost:1234/v1/chat/completions
CHAT_LLM_MODEL=phogpt-4b-chat
"""

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

# ==========================
# Cấu hình LLM
# ==========================

# LLM cho Text-to-SQL (Ollama)
SQL_LLM_URL = os.getenv("SQL_LLM_URL", "http://100.78.4.22:11434")
SQL_LLM_MODEL = os.getenv("SQL_LLM_MODEL", "qwen2.5-coder:7b")

# LLM cho chat tiếng Việt (OpenAI-compatible, ví dụ LM Studio + PhoGPT)
CHAT_LLM_URL = os.getenv("CHAT_LLM_URL","http://127.0.0.1:1234/v1/chat/completions")  # ví dụ: http://localhost:1234/v1/chat/completions
CHAT_LLM_MODEL = os.getenv("CHAT_LLM_MODEL","phogpt-4b-chat")  # ví dụ: phogpt-4b-chat

CHATBOT_KNOWLEDGE = ""

def load_chatbot_knowledge():
    global CHATBOT_KNOWLEDGE
    path = os.path.join(os.path.dirname(__file__), "chatbot_knowledge.txt")
    try:
        with open(path, "r", encoding="utf-8") as f:
            CHATBOT_KNOWLEDGE = f.read()
    except Exception as e:
        CHATBOT_KNOWLEDGE = ""
        print(f"Không thể load chatbot_knowledge.txt: {e}")
    

PRODUCT_KEYWORDS = {
    "nồi chiên không dầu": ["nồi chiên", "nồi chiên không dầu"],
    "nồi cơm": ["nồi cơm"],
    "máy hút bụi": ["máy hút bụi", "hút bụi"],
    "máy lọc không khí": ["máy lọc", "lọc không khí"],
    "máy xay sinh tố": ["máy xay", "xay sinh tố"],
    "quạt": ["quạt"],
    "bàn ủi": ["bàn ủi", "bàn là"],
}

# Whitelist bảng cho Text-to-SQL
WHITELIST_TABLES = {
    "KhachHang",
    "NhanVien",
    "DanhMuc",
    "SanPham",
    "Shipper",
    "DonHang",
    "DonHang_SanPham",
    "ThanhToan",
    "TaiKhoan",
    "DanhGia",
    "KhieuNai",
}
WHITELIST_TABLES_LC = {name.lower() for name in WHITELIST_TABLES}

TEXT2SQL_PROMPT = """Bạn là trợ lý sinh SQL cho MySQL.

Nhiệm vụ:
Từ câu hỏi tiếng Việt của người dùng, sinh ra DUY NHẤT một câu SELECT hợp lệ để truy vấn database bán hàng.

=====================
SCHEMA (CHỈ ĐƯỢC DÙNG CÁC BẢNG NÀY)
=====================
- KhachHang(MaKH, TenKH, SdtKH, EmailKH, DiaChiKH, IsDelete)
- NhanVien(MaNV, TenNV, ChucVu, SdtNV)
- DanhMuc(MaDanhMuc, TenDanhMuc, IsDelete)
- SanPham(MaSP, TenSP, GiaSP, SoLuongTonKho, MoTa, MaDanhMuc, IsDelete)
- DonHang(MaDonHang, NgayDat, TongTien, TrangThai, KhuyenMai, PhiShip, MaKH, MaNV, MaShipper)
- DonHang_SanPham(MaDonHang, MaSP, SoLuong, DonGia, GiamGia)
- DanhGia(MaDanhGia, NoiDung, DiemDanhGia, NgayDanhGia, IsDelete, MaSP, MaKH)

=====================
QUY TẮC BẮT BUỘC
=====================
1. CHỈ sinh 1 câu SELECT duy nhất.
2. KHÔNG có dấu ';' ở cuối.
3. BẮT BUỘC có LIMIT (tối đa 100).
   - Nếu không nói số lượng → dùng LIMIT 5.
4. KHÔNG dùng INSERT, UPDATE, DELETE, DROP, CREATE, ALTER.
5. KHÔNG dùng CTE (WITH).
6. KHÔNG dùng subquery phức tạp nếu không cần.

=====================
QUY TẮC GIÁ
=====================
- GiaSP lưu theo VND.
- "2 triệu" = 2000000.
- Tuyệt đối KHÔNG dùng 2000 cho "2 triệu".

=====================
QUY TẮC DANH MỤC & JOIN (RẤT QUAN TRỌNG)
=====================
CHỈ có 2 TRƯỜNG HỢP HỢP LỆ:

(1) KHÔNG JOIN DanhMuc  
→ CHỈ dùng bảng SanPham  
→ CHỈ lọc theo TenSP

Ví dụ hợp lệ:
SELECT MaSP, TenSP, GiaSP
FROM SanPham
WHERE TenSP LIKE '%nồi chiên%'
LIMIT 5

(2) CÓ JOIN DanhMuc  
→ BẮT BUỘC dùng alias:
  SanPham SP
  DanhMuc DM

Form CHUẨN (phải theo đúng form này):
FROM SanPham SP
JOIN DanhMuc DM ON SP.MaDanhMuc = DM.MaDanhMuc

→ Khi đã JOIN:
- SP.* chỉ dùng cho SanPham
- DM.* chỉ dùng cho DanhMuc

Ví dụ hợp lệ:
SELECT SP.MaSP, SP.TenSP, SP.GiaSP
FROM SanPham SP
JOIN DanhMuc DM ON SP.MaDanhMuc = DM.MaDanhMuc
WHERE DM.TenDanhMuc LIKE '%nồi chiên%'
LIMIT 5

KHÔNG BAO GIỜ:
- Dùng DM.TenDanhMuc khi KHÔNG JOIN
- Dùng alias SP nếu FROM chỉ là 'FROM SanPham'

=====================
QUY TẮC NHẬN DIỆN THIẾT BỊ
=====================
Các từ khóa:
- nồi cơm
- nồi chiên không dầu
- máy xay sinh tố
- máy hút bụi
- máy lọc không khí
- bình đun siêu tốc
- quạt
- bàn ủi

→ Ưu tiên:
1. TenSP LIKE '%từ khóa%'
2. HOẶC (nếu rõ ràng) DM.TenDanhMuc LIKE '%từ khóa%'

KHÔNG bịa tên sản phẩm hoặc danh mục mới.

=====================
SẮP XẾP
=====================
- Nếu hỏi "top", "bán chạy", "đánh giá cao":
  → ORDER BY GiaSP hoặc điểm đánh giá (nếu có JOIN DanhGia)
- Nếu không nói gì → không cần ORDER BY.

=====================
OUTPUT
=====================
- Chỉ trả về câu SELECT.
- Không giải thích.
- Không markdown.
- Không code block.

Câu hỏi: {question}
"""


# ==========================
# Models request/response
# ==========================

class ChatRequest(BaseModel):
    question: str
    params: Optional[Dict[str, Any]] = None


# ==========================
# Helper: Thêm URL cho sản phẩm
# ==========================

def add_product_url(row: Dict[str, Any]) -> Dict[str, Any]:
    """Thêm trường 'url' vào dict sản phẩm nếu có MaSP."""
    if "MaSP" in row:
        row["url"] = f"/products/{row['MaSP']}"
    return row


def add_product_urls(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Thêm trường 'url' cho danh sách sản phẩm."""
    return [add_product_url(row) for row in rows]


# ==========================
# 1. Các intent template (phase 1)
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


def _find_category_by_name(db: Session, keyword: str) -> Optional[DanhMuc]:
    if not keyword:
        return None
    return (
        db.query(DanhMuc)
        .filter(DanhMuc.TenDanhMuc.ilike(f"%{keyword}%"))
        .first()
    )

def intent_top_selling_products(
    db: Session,
    limit: int = 5,
):
    rows = (
        db.query(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
            func.sum(DonHang_SanPham.SoLuong).label("TongSoLuongBan"),
        )
        .join(DonHang_SanPham, SanPham.MaSP == DonHang_SanPham.MaSP)
        .filter(SanPham.IsDelete == False)
        .group_by(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
        )
        .order_by(func.sum(DonHang_SanPham.SoLuong).desc())
        .limit(limit)
        .all()
    )

    items = []
    for r in rows:
        items.append({
            "id": r.MaSP,
            "name": r.TenSP,
            "price": r.GiaSP,
            "sold": r.TongSoLuongBan,
            "url": f"/products/{r.MaSP}",
        })

    return {
        "mode": "template",
        "intent": "top_selling_products",
        "message": "Một số sản phẩm bán chạy hiện nay:",
        "items": items,
        "total": len(items),
    }


def intent_products_by_category_and_price(
    db: Session,
    category_keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 5,
):
    if not category_keyword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thiếu từ khóa danh mục (params.category_keyword).",
        )

    danh_muc = _find_category_by_name(db, category_keyword)
    if not danh_muc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy danh mục nào khớp với '{category_keyword}'.",
        )

    q = (
        db.query(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
            SanPham.SoLuongTonKho,
        )
        .filter(
            SanPham.MaDanhMuc == danh_muc.MaDanhMuc,
            SanPham.IsDelete == False,
        )
    )

    if min_price is not None:
        q = q.filter(SanPham.GiaSP >= min_price)
    if max_price is not None:
        q = q.filter(SanPham.GiaSP <= max_price)

    q = q.order_by(SanPham.GiaSP.asc()).limit(limit)
    rows = add_product_urls([dict(r._mapping) for r in q.all()])

    return {
        "mode": "template",
        "intent": "products_by_category_and_price",
        "message": (
            f"Tìm thấy {len(rows)} sản phẩm trong danh mục '{danh_muc.TenDanhMuc}'"
            + (f" từ {min_price:,.0f}" if min_price is not None else "")
            + (f" đến {max_price:,.0f}" if max_price is not None else "")
        ),
        "rows": rows,
    }


# ==========================
# 2. Keyword router cho intent (phase 1)
# ==========================

def detect_intent(question: str) -> Dict[str, object]:
    q = question.lower()

    keyword = extract_product_keyword(q)
    min_price, max_price = extract_price_range(q)
    email = extract_email(q)

    # 1. Đơn hàng theo email (ưu tiên cao)
    if email and any(k in q for k in ["đơn", "đặt", "mua"]):
        return {
            "intent": "orders_by_customer_email",
            "email": email,
        }

    # 2. Top sản phẩm theo đánh giá
    if any(k in q for k in ["top", "đánh giá cao", "review tốt"]):
        return {
            "intent": "top_products_by_rating",
        }

    if any(k in q for k in [
    "bán chạy",
    "mua nhiều",
    "nhiều người mua",
    "hot nhất"
    ]):
        return {
            "intent": "top_selling_products"
        }


    # 3. Sản phẩm theo keyword + giá
    if keyword and (min_price is not None or max_price is not None):
        return {
            "intent": "products_by_keyword_and_price",
            "keyword": keyword,
            "min_price": min_price,
            "max_price": max_price,
        }

    # 4. Sản phẩm theo keyword
    if keyword:
        return {
            "intent": "products_by_keyword",
            "keyword": keyword,
        }

    # 5. Không nhận diện được → Phase 2 (LLM)
    return {
        "intent": "unknown",
    }
    
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
        return (
            int(m_between.group(1)) * 1_000_000,
            int(m_between.group(2)) * 1_000_000,
        )

    return None, None

def extract_email(question: str) -> Optional[str]:
    m = re.search(
        r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
        question
    )
    return m.group(0) if m else None

def intent_products_by_keyword_and_price(
    db: Session,
    keyword: str,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    limit: int = 5,
):
    q = (
        db.query(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
            SanPham.SoLuongTonKho,
        )
        .filter(
            SanPham.TenSP.ilike(f"%{keyword}%"),
            SanPham.IsDelete == False,
        )
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

def intent_products_by_keyword(
    db: Session,
    keyword: str,
    limit: int = 5,
):
    rows = (
        db.query(
            SanPham.MaSP,
            SanPham.TenSP,
            SanPham.GiaSP,
            SanPham.SoLuongTonKho,
        )
        .filter(
            SanPham.TenSP.ilike(f"%{keyword}%"),
            SanPham.IsDelete == False,
        )
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
# 3. Text-to-SQL bằng LLM (phase 2)
# ==========================

import re

def clean_sql_response(raw: str) -> str:
    sql = raw.strip()

    # Bỏ ```sql ... ``` nếu có
    if sql.startswith("```"):
        # loại bỏ tất cả backticks
        sql = sql.strip("`")
        # bỏ prefix 'sql' nếu có
        if sql.lower().startswith("sql"):
            sql = sql[3:].strip()

    # Lấy CHỈ câu lệnh đầu tiên trước dấu ';'
    # để tránh trường hợp model sinh: "SELECT ...; LIMIT 50"
    if ";" in sql:
        sql = sql.split(";", 1)[0]

    return sql.strip()




def generate_sql_with_llm(question: str) -> str:
    if not SQL_LLM_URL or not SQL_LLM_MODEL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chưa cấu hình SQL_LLM_URL hoặc SQL_LLM_MODEL.",
        )

    payload = {
        "model": SQL_LLM_MODEL,
        "prompt": TEXT2SQL_PROMPT.format(question=question),
        "stream": False,
    }

    try:
        timeout = httpx.Timeout(connect=10.0, read=180.0, write=30.0, pool=10.0)
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(f"{SQL_LLM_URL}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw = data.get("response", "")
            sql = clean_sql_response(raw)

            # Nếu LLM quên LIMIT thì tự thêm LIMIT 5
            low = sql.lower()
            if not re.search(r'\blimit\b', low):
                sql = sql.strip() + " LIMIT 5"

            return sql
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lỗi gọi SQL LLM (Ollama): {e}",
        )


def is_safe_sql(sql: str) -> bool:
    sql_clean = sql.strip()

    # Không cho phép nhiều câu
    if ";" in sql_clean:
        return False

    low = sql_clean.lower()

    # Chỉ cho phép SELECT
    banned = ["insert", "update", "delete", "alter", "drop", "create", "truncate"]
    if any(b in low for b in banned):
        return False
    if not low.startswith("select"):
        return False

    try:
        ast = parse_one(sql_clean, read="mysql")
    except Exception:
        return False

    # ---- Xử lý bảng thật ----
    real_tables = set()
    real_tables_lc = set()

    for tbl in ast.find_all(exp.Table):
        real = tbl.name
        if not real:
            return False

        real_lc = real.lower()
        real_tables.add(real)
        real_tables_lc.add(real_lc)

        if real_lc not in WHITELIST_TABLES_LC:
            return False

    # ---- Xử lý alias hợp lệ ----
    alias_map = {}
    for tbl in ast.find_all(exp.Table):
        if tbl.alias and getattr(tbl.alias, "name", None):
            alias_map[tbl.alias.name] = tbl.name

    # ---- Kiểm tra cột prefix (SP.TenSP, DM.TenDanhMuc) ----
    for col in ast.find_all(exp.Column):
        prefix = col.table  # SP hoặc DM
        if prefix:
            prefix_l = prefix.lower()

            # Hợp lệ nếu:
            # - prefix là alias hợp lệ (SP, DM)
            # - hoặc prefix là tên bảng thật
            if (prefix not in alias_map) and (prefix_l not in real_tables_lc):
                return False

    # ---- Bắt buộc có LIMIT <= 100 ----
    limit_nodes = list(ast.find_all(exp.Limit))
    if not limit_nodes:
        return False

    for node in limit_nodes:
        try:
            val = int(node.expression.this)
        except:
            return False
        if val > 100:
            return False

    return True


def execute_raw_sql(db: Session, sql: str) -> List[Dict[str, Any]]:
    result = db.execute(text(sql))
    return [dict(r._mapping) for r in result]


# ==========================
# 3b. Chat tiếng Việt bằng LLM riêng (PhoGPT / LM Studio)
# ==========================

def generate_chat_with_llm(messages: list) -> str:
    """
    Gọi LLM chat (PhoGPT / LM Studio).
    messages: list[{"role": "...", "content": "..."}]
    """
    if not CHAT_LLM_URL or not CHAT_LLM_MODEL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chưa cấu hình CHAT_LLM_URL hoặc CHAT_LLM_MODEL.",
        )

    # BẮT BUỘC normalize cho LM Studio
    messages = normalize_lmstudio_messages(messages)

    payload = {
        "model": CHAT_LLM_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 512,
    }

    try:
        timeout = httpx.Timeout(connect=10.0, read=60.0, write=20.0, pool=10.0)
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(CHAT_LLM_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()

            message = data["choices"][0]["message"]
            return extract_lmstudio_text(message)


    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lỗi gọi Chat LLM: {e}",
        )



def normalize_lmstudio_messages(messages: list) -> list:
    normalized = []

    for m in messages:
        content = m.get("content")

        if isinstance(content, str):
            normalized.append({
                "role": m["role"],
                "content": [
                    {
                        "type": "text",
                        "text": content
                    }
                ]
            })
        else:
            normalized.append(m)

    return normalized

def extract_lmstudio_text(message: dict) -> str:
    """
    Trích text từ response của LM Studio,
    hỗ trợ cả content dạng string và list[{type,text}]
    """
    content = message.get("content")

    # Case 1: content là string
    if isinstance(content, str):
        return content.strip()

    # Case 2: content là list (multimodal)
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                return item.get("text", "").strip()

    return ""


# ==========================
# 4. Endpoint chính Text-to-SQL (2-phase)
# ==========================

@router.post("/ask")
def ask_chatbot(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Chatbot 2-phase cho TRUY VẤN DỮ LIỆU:
    - Phase 1: xử lý bằng rule-based intent (SQLAlchemy).
    - Phase 2: fallback sang LLM sinh SQL nếu không nhận diện được intent.
    """

    intent_data = detect_intent(req.question)

    # --------- Phase 1: Rule-based intents ---------

    if intent_data["intent"] == "top_products_by_rating":
        return intent_top_products_by_rating(db)

    if intent_data["intent"] == "orders_by_customer_email":
        return intent_orders_by_email(
            db,
            email=intent_data["email"]
        )

    if intent_data["intent"] == "products_by_keyword_and_price":
        return intent_products_by_keyword_and_price(
            db,
            keyword=intent_data["keyword"],
            min_price=intent_data["min_price"],
            max_price=intent_data["max_price"],
        )

    if intent_data["intent"] == "products_by_keyword":
        return intent_products_by_keyword(
            db,
            keyword=intent_data["keyword"],
        )
        
    if intent_data["intent"] == "top_selling_products":
        return intent_top_selling_products(db)

    # --------- Phase 2: LLM Text-to-SQL fallback ---------

    sql = generate_sql_with_llm(req.question)

    if not is_safe_sql(sql):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Truy vấn do LLM sinh ra không an toàn, đã bị chặn:\n{sql}",
        )

    rows = execute_raw_sql(db, sql)

    # Thêm URL cho sản phẩm nếu kết quả có MaSP
    rows = add_product_urls(rows)

    return {
        "mode": "llm_sql",
        "intent": None,
        "message": "Truy vấn được sinh tự động bằng LLM (đã kiểm duyệt).",
        "sql": sql,
        "rows": rows,
    }

# ==========================
# 5. Endpoint chat tiếng Việt (không đụng DB)
# ==========================

def is_internal_data_question(question: str) -> bool:
    q = question.lower()
    keywords = [
        "doanh thu",
        "thống kê",
        "tồn kho",
        "bao nhiêu đơn",
        "số lượng bán",
    ]
    return any(k in q for k in keywords)

def is_policy_question(question: str) -> bool:
    q = question.lower()
    keywords = [
    "bảo hành", "hỏng", "lỗi", "sửa",
    "đổi", "trả", "hoàn",
    "ship", "giao", "vận chuyển",
    "thanh toán", "cod",
    "chính sách",
    ]
    return any(k in q for k in keywords)

@router.post("/chat")
def chat_with_bot(
    req: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    # 1. Chặn câu hỏi dữ liệu nội bộ
    if is_internal_data_question(req.question):
        return {
            "mode": "chat",
            "message": (
                "Mình chỉ có thể hỗ trợ tư vấn và giới thiệu sản phẩm cho bạn. "
                "Bạn có thể hỏi mình về các loại sản phẩm, giá cả hoặc gợi ý phù hợp nhé."
            ),
        }

    # 2. POLICY RAG (STATIC)
    if is_policy_question(req.question):
        messages = [
            {
                "role": "system",
                "content": (
                    "Bạn là chatbot hỗ trợ khách hàng cho cửa hàng đồ gia dụng. "
                    "Bạn CHỈ được trả lời dựa trên thông tin sau. "
                    "KHÔNG suy đoán, KHÔNG thêm thông tin ngoài nội dung này.\n\n"
                    f"{CHATBOT_KNOWLEDGE}"
                ),
            },
            {"role": "user", "content": req.question},
        ]

        answer = generate_chat_with_llm(messages)
        return {
            "mode": "chat",
            "source": "policy",
            "message": answer,
        }

    # 3. CHAT THƯỜNG
    messages = [
        {
            "role": "system",
            "content": (
                "Bạn là chatbot hỗ trợ khách hàng cho cửa hàng đồ gia dụng. "
                "Nói tiếng Việt tự nhiên, thân thiện. "
                "Không chèn copyright, footer, markdown."
            ),
        },
        {"role": "user", "content": req.question},
    ]

    answer = generate_chat_with_llm(messages)
    return {
        "mode": "chat",
        "source": "general",
        "message": answer,
    }
