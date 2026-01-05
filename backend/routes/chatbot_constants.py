# backend/routes/chatbot_constants.py

import os

"""
{
    "username": "0912345678",
    "password": "   "
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
        "CHÍNH SÁCH BẢO HÀNH\n\n"
        "Tất cả sản phẩm được bảo hành 12 tháng kể từ ngày mua.\n\n"
        "Bảo hành áp dụng:\n"
        "   - Lỗi kỹ thuật do nhà sản xuất\n"
        "   - Sử dụng bình thường theo hướng dẫn\n\n"
        "Không áp dụng bảo hành:\n"
        "   - Sản phẩm bị rơi vỡ, va đập mạnh\n"
        "   - Sản phẩm bị vào nước\n"
        "   - Sử dụng sai hướng dẫn hoặc mục đích\n\n"
        "Liên hệ: Khi sản phẩm gặp lỗi kỹ thuật, vui lòng liên hệ cửa hàng để được hướng dẫn bảo hành."
    ),
    "doi_tra": (
        "CHÍNH SÁCH ĐỔI TRẢ\n\n"
        "Thời hạn: 30 ngày kể từ ngày mua hàng\n\n"
        "Điều kiện áp dụng:\n"
        "   - Sản phẩm còn nguyên tem, hộp và phụ kiện\n"
        "   - Sản phẩm chưa qua sử dụng\n"
        "   - Có kèm hóa đơn mua hàng\n\n"
        "Không áp dụng:\n"
        "   - Sản phẩm khuyến mãi, giảm giá đặc biệt\n"
        "   - Sản phẩm điện tử đã sử dụng\n"
        "   - Sản phẩm bị hư hỏng do lỗi khách hàng\n\n"
        "Quy trình:\n"
        "   1. Liên hệ bộ phận CSKH\n"
        "   2. Cung cấp thông tin đơn hàng và lý do\n"
        "   3. Nhận nhãn vận chuyển\n"
        "   4. Hoàn tiền trong 7-10 ngày làm việc"
    ),
    "thanh_toan": (
        "CHÍNH SÁCH THANH TOÁN\n\n"
        "Cửa hàng hỗ trợ các hình thức thanh toán:\n\n"
        "Thanh toán khi nhận hàng (COD)\n"
        "   - An toàn, tiện lợi\n"
        "   - Kiểm tra hàng trước khi thanh toán\n\n"
        "Chuyển khoản ngân hàng\n"
        "   - Thông tin tài khoản sẽ được gửi khi đặt hàng\n"
        "   - Đơn hàng được xử lý sau khi nhận thanh toán\n\n"
        "Ví điện tử\n"
        "   - Hỗ trợ: Momo, ZaloPay, VNPay\n"
        "   - Thanh toán nhanh chóng, bảo mật\n\n"
        "Liên hệ: Hình thức thanh toán cụ thể sẽ được xác nhận khi đặt hàng."
    ),
    "van_chuyen": (
        "CHÍNH SÁCH VẬN CHUYỂN\n\n"
        "Thời gian giao hàng:\n"
        "   - Tiêu chuẩn: 5-7 ngày\n"
        "   - Nhanh: 2-3 ngày\n"
        "   - Siêu tốc: 1 ngày\n\n"
        "Phí vận chuyển:\n"
        "   - Tính theo địa chỉ và phương thức giao hàng\n"
        "   - MIỄN PHÍ cho đơn hàng từ 10 triệu đồng\n\n"
        "Xử lý đơn hàng:\n"
        "   - Đơn hàng được xử lý trong 24 giờ\n"
        "   - Gửi mã theo dõi qua email/SMS\n\n"
        "Đơn hàng bị mất/hư hỏng:\n"
        "   - Liên hệ trong vòng 48 giờ kể từ khi nhận\n"
        "   - Cửa hàng sẽ xử lý và đổi hàng mới"
    )
}

POLICY_SYNONYMS = {
    "bao_hanh": [
        "bảo hành", "warranty", "bảo trì", "maintain",
        "hỏng", "lỗi", "hư", "broken", "error", "fail",
        "không chạy", "không hoạt động", "không dùng được", "chết máy",
        "sửa", "sửa chữa", "repair", "fix",
        "thời gian bảo hành", "thời hạn bảo hành", "bảo hành bao lâu",
        "có được bảo hành không", "bảo hành như thế nào",
        "điều kiện bảo hành", "quy định bảo hành",
        "mất bảo hành", "hết bảo hành", "expire warranty"
    ],
    "doi_tra": [
        "đổi", "trả", "đổi trả", "return", "refund", "exchange",
        "hoàn tiền", "hoàn lại tiền", "trả tiền lại", "refund",
        "trả hàng", "trả lại hàng", "gửi lại",
        "không ưng", "không vừa ý", "không hài lòng", "không đúng",
        "đổi size", "đổi màu", "đổi mẫu", "đổi sản phẩm khác",
        "hoàn trả", "chính sách đổi trả", "quy định đổi trả",
        "thời hạn đổi trả", "bao lâu được đổi", "đổi trong bao nhiêu ngày",
        "điều kiện đổi trả", "làm sao để đổi", "cách đổi hàng",
        "không muốn nữa", "mua nhầm", "không phù hợp"
    ],
    "van_chuyen": [
        "ship", "shipping", "vận chuyển", "giao hàng", "delivery",
        "khi nào tới", "khi nào đến", "bao giờ nhận được", "bao lâu nhận được",
        "thời gian giao", "giao bao lâu", "mất bao lâu", "how long",
        "phí ship", "phí vận chuyển", "phí giao hàng", "ship phí", "shipping fee",
        "ship cod", "giao cod", "ship hàng",
        "miễn phí ship", "free ship", "freeship", "miễn ship",
        "tracking", "theo dõi đơn", "kiểm tra đơn hàng", "tra cứu",
        "giao nhanh", "giao hỏa tốc", "giao siêu tốc", "express",
        "shipper", "người giao", "tài xế", "bưu tá",
        "chưa nhận được hàng", "hàng chưa tới", "sao chưa tới",
        "hàng bị mất", "không nhận được", "thất lạc"
    ],
    "thanh_toan": [
        "thanh toán", "payment", "pay", "trả tiền", "đóng tiền",
        "cod", "tiền mặt", "ship cod", "nhận hàng trả tiền",
        "chuyển khoản", "ck", "transfer", "banking",
        "ví điện tử", "e-wallet", "ví momo", "ví zalopay",
        "momo", "zalopay", "vnpay", "shopeepay", "viettelpay",
        "thẻ", "thẻ tín dụng", "thẻ atm", "credit card", "debit",
        "hình thức thanh toán", "phương thức thanh toán", "cách thanh toán",
        "trả trước", "trả sau", "thanh toán trước", "thanh toán sau",
        "có được", "được không", "hỗ trợ không",
        "an toàn không", "bảo mật không", "secure",
        "hóa đơn", "invoice", "bill", "receipt"
    ]
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
