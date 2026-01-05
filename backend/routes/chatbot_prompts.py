# backend/routes/chatbot_prompts.py

TEXT2SQL_PROMPT = """Sinh SQL SELECT cho MySQL từ câu hỏi tiếng Việt.

SCHEMA:
- KhachHang(MaKH, TenKH, SdtKH, EmailKH, DiaChiKH, IsDelete)
- NhanVien(MaNV, TenNV, ChucVu, SdtNV)
- DanhMuc(MaDanhMuc, TenDanhMuc, IsDelete)
- SanPham(MaSP, TenSP, GiaSP, SoLuongTonKho, MoTa, MaDanhMuc, IsDelete)
- DonHang(MaDonHang, NgayDat, TongTien, TrangThai, KhuyenMai, PhiShip, MaKH, MaNV)
- DonHang_SanPham(MaDonHang, MaSP, SoLuong, DonGia, GiamGia)
- DanhGia(MaDanhGia, NoiDung, DiemDanhGia, NgayDanhGia, IsDelete, MaSP, MaKH)

QUY TẮC:
1. CHỈ sinh SELECT, không có dấu ';'
2. BẮT BUỘC có LIMIT (mặc định 5, tối đa 100)
3. KHÔNG dùng INSERT/UPDATE/DELETE/DROP/CREATE/ALTER
4. Giá: "2 triệu" = 2000000 (VND)

JOIN DANHMUC:
- KHÔNG JOIN: WHERE TenSP LIKE '%từ khóa%'
- CÓ JOIN: dùng alias SP/DM
  FROM SanPham SP
  JOIN DanhMuc DM ON SP.MaDanhMuc = DM.MaDanhMuc
  WHERE DM.TenDanhMuc LIKE '%từ khóa%'

VÍ DỤ:
Q: "Tìm nồi chiên dưới 2 triệu"
A: SELECT MaSP, TenSP, GiaSP FROM SanPham WHERE TenSP LIKE '%nồi chiên%' AND GiaSP < 2000000 LIMIT 5

Q: "Sản phẩm bán chạy"
A: SELECT SP.MaSP, SP.TenSP, SUM(DSP.SoLuong) AS TongBan FROM SanPham SP JOIN DonHang_SanPham DSP ON SP.MaSP = DSP.MaSP GROUP BY SP.MaSP, SP.TenSP ORDER BY TongBan DESC LIMIT 5

Q: "Top sản phẩm đánh giá cao"
A: SELECT SP.MaSP, SP.TenSP, AVG(DG.DiemDanhGia) AS TB FROM SanPham SP JOIN DanhGia DG ON SP.MaSP = DG.MaSP GROUP BY SP.MaSP, SP.TenSP HAVING COUNT(*) >= 3 ORDER BY TB DESC LIMIT 5

OUTPUT: Chỉ trả SQL, không giải thích, không markdown.

Câu hỏi: {question}
"""

PARAPHRASE_SYSTEM_PROMPT = """Viết lại đoạn văn sau cho dễ hiểu hơn đối với khách hàng.
Giữ nguyên toàn bộ ý nghĩa.
Không thêm thông tin.
Không bỏ thông tin.
Không chào hỏi, không cảm ơn, không giải thích thêm."""
