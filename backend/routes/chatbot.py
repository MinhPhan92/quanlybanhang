# backend/routes/chatbot.py

from typing import Any, Dict, Optional, List
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
SQL_LLM_URL = os.getenv("SQL_LLM_URL", "http://localhost:11434")
SQL_LLM_MODEL = os.getenv("SQL_LLM_MODEL", "qwen2.5-coder:3b")

# LLM cho chat tiếng Việt (OpenAI-compatible, ví dụ LM Studio + PhoGPT)
CHAT_LLM_URL = os.getenv("CHAT_LLM_URL","http://127.0.0.1:1234/v1/chat/completions")  # ví dụ: http://localhost:1234/v1/chat/completions
CHAT_LLM_MODEL = os.getenv("CHAT_LLM_MODEL","phogpt-4b-chat")  # ví dụ: phogpt-4b-chat

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

TEXT2SQL_PROMPT = """Bạn là trợ lý SQL cho MySQL.
Nhiệm vụ: Từ câu hỏi tiếng Việt của người dùng, sinh ra DUY NHẤT một câu SELECT hợp lệ cho MySQL, truy vấn dữ liệu trong database bán hàng với schema:

- KhachHang(MaKH, TenKH, SdtKH, EmailKH, DiaChiKH, IsDelete)
- NhanVien(MaNV, TenNV, ChucVu, SdtNV)
- DanhMuc(MaDanhMuc, TenDanhMuc, IsDelete)
- SanPham(MaSP, TenSP, GiaSP, SoLuongTonKho, MoTa, MaDanhMuc, IsDelete)
- Shipper(MaShipper, TenShipper, SdtShipper, DonViGiao, BienSoXe, TrangThai, IsDelete)
- DonHang(MaDonHang, NgayDat, TongTien, TrangThai, KhuyenMai, PhiShip, MaKH, MaNV, MaShipper)
- DonHang_SanPham(MaDonHang, MaSP, SoLuong, DonGia, GiamGia)
- ThanhToan(MaThanhToan, PhuongThuc, NgayThanhToan, SoTien, TrangThai, MaDonHang)
- TaiKhoan(MaTK, Username, Pass, VaiTro, IsDelete, MaKH, MaNV)
- DanhGia(MaDanhGia, NoiDung, DiemDanhGia, NgayDanhGia, IsDelete, MaSP, MaKH)
- KhieuNai(MaKhieuNai, NoiDung, NgayKhieuNai, IsDelete, MaKH)

Yêu cầu bắt buộc:
- CHỈ dùng SELECT (không INSERT, UPDATE, DELETE, ALTER, DROP, CREATE,...).
- CHỈ được sinh MỘT câu SELECT duy nhất (không có dấu ';' ở cuối, không nhiều câu lệnh).
- BẮT BUỘC phải có LIMIT <= 100 ở cuối câu lệnh.
- Nếu người dùng không nói gì về số lượng, hãy dùng LIMIT 50.
- Không dùng CTE phức tạp, không dùng nhiều subquery lồng nhau nếu không cần.
- Nếu câu hỏi chung chung (ví dụ: "top nồi chiên không dầu dưới 2 triệu"), hãy ORDER BY giá hoặc điểm đánh giá hợp lý.

Trả về CHỈ câu SELECT, không thêm bất kỳ lời giải thích nào.

QUY TẮC JOIN QUAN TRỌNG:
- Nếu cần lọc theo DanhMuc.TenDanhMuc thì BẮT BUỘC phải JOIN DanhMuc:
  FROM SanPham SP
  JOIN DanhMuc DM ON SP.MaDanhMuc = DM.MaDanhMuc
  WHERE DM.TenDanhMuc LIKE '%...%'
- KHÔNG ĐƯỢC dùng DanhMuc.TenDanhMuc trong WHERE nếu FROM chỉ có SanPham.

Về danh mục:
- Nếu người dùng nói 'nồi cơm','máy xay sinh tố','máy sinh tố','bếp điện và bếp từ','bếp điện','bếp từ','lò vi sóng','máy lọc không khí','máy hút bụi','bình đun siêu tốc','bình siêu tốc','nồi chiên không dầu','máy sấy','bàn ủi','quạt','máy lọc', hãy hiểu là tìm trong:
  - TenSP có chứa từ khoá tương ứng (dùng LIKE), đừng bịa tên sản phẩm mới. 
  HOẶC
  - DanhMuc.TenDanhMuc có chứa tên danh mục tương ứng (dùng LIKE), đừng bịa tên danh mục mới.
KHÔNG ĐƯỢC dùng DanhMuc.TenDanhMuc trong WHERE nếu chưa JOIN DanhMuc DM ON ...
Nếu người dùng không hỏi liên quan đến DanhMuc, 
KHÔNG bao giờ dùng DanhMuc.TenDanhMuc trong WHERE.
Chỉ dùng TenSP (LIKE ...) khi không rõ danh mục.

Về alias:
- Nếu dùng alias cho bảng, hãy dùng nhất quán:
  FROM SanPham SP
  JOIN DanhMuc DM ON SP.MaDanhMuc = DM.MaDanhMuc
  WHERE SP.TenSP LIKE '%...%' OR DM.TenDanhMuc LIKE '%...%'
- KHÔNG ĐƯỢC dùng SP.MaDanhMuc nếu FROM chỉ là 'FROM SanPham' (không có alias SP).
- Hoặc: nếu không cần thiết thì đừng dùng alias, chỉ viết 'SanPham.TenSP', 'DanhMuc.TenDanhMuc'.

Lưu ý QUAN TRỌNG về giá:
- Cột GiaSP lưu theo đơn vị VND (đồng).
- Khi người dùng nói 'triệu', ví dụ '2 triệu' thì phải hiểu là 2000000.
- KHÔNG bao giờ dùng 2000 để biểu diễn '2 triệu'. Luôn dùng 2000000.

Câu hỏi: {question}
"""

# ==========================
# Models request/response
# ==========================

class ChatRequest(BaseModel):
    question: str
    params: Optional[Dict[str, Any]] = None


# ==========================
# 1. Các intent template (phase 1)
# ==========================

def intent_top_products_by_rating(db: Session, limit: int = 10, min_reviews: int = 5):
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
    rows = [dict(r._mapping) for r in q.all()]
    return {
        "mode": "template",
        "intent": "top_products_by_rating",
        "message": f"Top {len(rows)} sản phẩm theo đánh giá (>= {min_reviews} lượt).",
        "rows": rows,
    }


def intent_orders_by_email(db: Session, email: str, limit: int = 10):
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


def intent_products_by_category_and_price(
    db: Session,
    category_keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 20,
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
    rows = [dict(r._mapping) for r in q.all()]

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

def detect_intent(question: str, params: dict) -> str:
    q = question.lower()

    # Intent 1: top sản phẩm theo đánh giá (không cần params)
    if "top" in q and ("đánh giá" in q or "review" in q) and "sản phẩm" in q:
        return "top_products_by_rating"

    # Intent 2: đơn hàng theo email -> chỉ kích nếu đã có email trong params
    if "đơn" in q and "email" in q and params.get("email"):
        return "orders_by_email"

    # Intent 3: sản phẩm theo danh mục + giá -> chỉ kích nếu đã có category_keyword
    if params.get("category_keyword"):
        if any(
            k in q
            for k in [
                "nồi chiên",
                "noi chien",
                "nồi cơm",
                "noi com",
                "máy lọc",
                "may loc",
                "máy hút bụi",
                "hut bui",
            ]
        ):
            return "products_by_category_and_price"

    # Còn lại: để Phase 2 (LLM) xử lý
    return "unknown"


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

            # Nếu LLM quên LIMIT thì tự thêm LIMIT 50
            low = sql.lower()
            if not re.search(r'\blimit\b', low):
                sql = sql.strip() + " LIMIT 50"

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

def generate_chat_with_llm(question: str) -> str:
    """
    Gọi LLM chat (PhoGPT hoặc model khác) qua API dạng OpenAI-compatible.
    Dùng cho hội thoại thuần tiếng Việt, KHÔNG sinh SQL.
    """
    if not CHAT_LLM_URL or not CHAT_LLM_MODEL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chưa cấu hình CHAT_LLM_URL hoặc CHAT_LLM_MODEL.",
        )

    messages = [
        {
            "role": "system",
            "content": (
                "Bạn là trợ lý ảo nói tiếng Việt, thân thiện, "
                "giải thích dễ hiểu. Không bịa số liệu về đơn hàng/thống kê nội bộ. "
                "Nếu người dùng hỏi dữ liệu cụ thể trong hệ thống (doanh thu, đơn hàng, tồn kho...), "
                "hãy gợi ý họ dùng chức năng 'truy vấn dữ liệu' của hệ thống."
            ),
        },
        {"role": "user", "content": question},
    ]

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
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lỗi gọi Chat LLM: {e}",
        )


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
    - Phase 1: thử dùng intent template (nhanh, an toàn, không cần LLM).
    - Phase 2: nếu unknown -> dùng LLM SQL sinh câu SELECT, kiểm duyệt, rồi execute.
    """
    params = req.params or {}
    intent = detect_intent(req.question, params)

    # --------- Phase 1: template intents ---------
    if intent == "top_products_by_rating":
        limit = int(params.get("limit", 10))
        min_reviews = int(params.get("min_reviews", 5))
        return intent_top_products_by_rating(db, limit=limit, min_reviews=min_reviews)

    if intent == "orders_by_email":
        email = params.get("email")
        limit = int(params.get("limit", 10))
        return intent_orders_by_email(db, email=email, limit=limit)

    if intent == "products_by_category_and_price":
        category_keyword = params.get("category_keyword")
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        limit = int(params.get("limit", 20))

        min_p = float(min_price) if min_price is not None else None
        max_p = float(max_price) if max_price is not None else None

        return intent_products_by_category_and_price(
            db,
            category_keyword=category_keyword,
            min_price=min_p,
            max_price=max_p,
            limit=limit,
        )

    # --------- Phase 2: Text-to-SQL bằng LLM ---------
    sql = generate_sql_with_llm(req.question)

    if not is_safe_sql(sql):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Truy vấn do LLM sinh ra không an toàn, đã bị chặn:\n{sql}",
        )

    rows = execute_raw_sql(db, sql)

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

@router.post("/chat")
def chat_with_bot(
    req: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Chatbot hội thoại tiếng Việt (PhoGPT / model khác).
    Không sinh SQL, không truy vấn database.
    Dùng cho tư vấn, giải thích chung.
    """
    answer = generate_chat_with_llm(req.question)
    return {
        "mode": "chat",
        "message": answer,
    }
