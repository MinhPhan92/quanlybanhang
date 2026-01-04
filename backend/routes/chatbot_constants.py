# backend/routes/chatbot_constants.py

import os

"""
{
    "username": "0912345678",
    "password": "customer123"
}
"""
# ==========================
# Cấu hình LLM
# ==========================

# LLM cho Text-to-SQL (Ollama)
SQL_LLM_URL = os.getenv("SQL_LLM_URL", "http://100.78.4.22:11434")
SQL_LLM_MODEL = os.getenv("SQL_LLM_MODEL", "qwen2.5-coder:7b")

# LLM cho chat tiếng Việt (OpenAI-compatible, ví dụ LM Studio + PhoGPT)
CHAT_LLM_URL = os.getenv("CHAT_LLM_URL","http://100.78.4.22:11436")
CHAT_LLM_MODEL = os.getenv("CHAT_LLM_MODEL","qwen2.5:7b-instruct")

# ==========================
# Keyword Mappings
# ==========================

PRODUCT_KEYWORDS = {
    "nồi chiên không dầu": ["nồi chiên", "nồi chiên không dầu"],
    "nồi cơm": ["nồi cơm"],
    "máy hút bụi": ["máy hút bụi", "hút bụi"],
    "máy lọc không khí": ["máy lọc", "lọc không khí"],
    "máy xay sinh tố": ["máy xay", "xay sinh tố"],
    "quạt": ["quạt"],
    "bàn ủi": ["bàn ủi", "bàn là"],
}

# ==========================
# Cấu hình Policy Hybrid
# ==========================

POLICY_TEMPLATES = {
    "bao_hanh": (
        "Tất cả sản phẩm được bảo hành 12 tháng kể từ ngày mua.\n"
        "Bảo hành áp dụng cho các lỗi kỹ thuật do nhà sản xuất trong quá trình sử dụng bình thường.\n"
        "Không áp dụng bảo hành trong các trường hợp sau:\n"
        "    - Sản phẩm bị rơi vỡ hoặc va đập mạnh.\n"
        "    - Sản phẩm bị vào nước.\n"
        "    - Sử dụng sản phẩm sai hướng dẫn hoặc sai mục đích.\n"
        "Nếu sản phẩm gặp lỗi kỹ thuật, khách hàng có thể liên hệ cửa hàng để được hướng dẫn bảo hành."
    ),
    "doi_tra": (
        "Khách hàng có thể đổi hoặc trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng.\n"
        "Điều kiện áp dụng đổi trả:\n"
        "    - Sản phẩm còn nguyên tem và hộp.\n"
        "    - Sản phẩm chưa qua sử dụng.\n"
        "    - Không áp dụng đổi trả đối với các sản phẩm thuộc chương trình khuyến mãi hoặc giảm giá.\n"
        "Khi có nhu cầu đổi trả, khách hàng vui lòng liên hệ cửa hàng sớm để được hỗ trợ."
    ),
    "thanh_toan": (
        "Cửa hàng hiện hỗ trợ các hình thức thanh toán sau:\n"
        "    - Thanh toán khi nhận hàng (COD).\n"
        "    - Chuyển khoản ngân hàng.\n"
        "    - Thanh toán qua ví điện tử.\n"
        "Hình thức thanh toán cụ thể sẽ được xác nhận trong quá trình đặt hàng."
    ),
    "van_chuyen": (
        "Thời gian giao hàng dự kiến từ 2 đến 5 ngày làm việc, tùy thuộc vào khu vực giao hàng.\n"
        "Phí vận chuyển sẽ được thông báo cụ thể khi khách hàng tiến hành đặt hàng.\n"
        "Cửa hàng sẽ cố gắng giao hàng sớm nhất có thể để đảm bảo trải nghiệm mua sắm tốt cho khách hàng."
    )
}

POLICY_SYNONYMS = {
    "bao_hanh": ["bảo hành", "hỏng", "lỗi", "không chạy", "sửa", "bảo trì"],
    "doi_tra": ["đổi", "trả", "không ưng", "hoàn tiền", "trả hàng"],
    "van_chuyen": ["ship", "vận chuyển", "giao hàng", "khi nào tới", "bao lâu nhận được"],
    "thanh_toan": ["thanh toán", "cod", "chuyển khoản", "ví điện tử", "trả tiền"]
}

# ==========================
# Whitelist cho Text-to-SQL
# ==========================
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
