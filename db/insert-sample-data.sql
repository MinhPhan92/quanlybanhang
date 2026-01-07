-- =======================================
-- INSERT SAMPLE DATA
-- Mỗi bảng có khoảng 8 dòng dữ liệu
-- Dựa trên schema: db-ban-do-gia-dung (2).sql
-- =======================================

USE QuanLyBanHang;

-- =======================================
-- 1. DANH MỤC (Categories)
-- =======================================
INSERT INTO DanhMuc (TenDanhMuc, IsDelete) VALUES
('Tủ lạnh', 0),
('Máy giặt', 0),
('Máy lạnh', 0),
('Bếp từ', 0),
('Lò vi sóng', 0),
('Máy hút bụi', 0),
('Quạt điện', 0),
('Máy nước nóng', 0);

-- =======================================
-- 2. NHÂN VIÊN (Employees)
-- =======================================
INSERT INTO NhanVien (TenNV, ChucVu, SdtNV) VALUES
('Nguyễn Văn An', 'Manager', '0901234567'),
('Trần Thị Bình', 'Employee', '0901234568'),
('Lê Văn Cường', 'Employee', '0901234569'),
('Phạm Thị Dung', 'Employee', '0901234570'),
('Hoàng Văn Em', 'Employee', '0901234571'),
('Vũ Thị Phương', 'Employee', '0901234572'),
('Đặng Văn Giang', 'Employee', '0901234573'),
('Bùi Thị Hoa', 'Employee', '0901234574');

-- =======================================
-- 3. KHÁCH HÀNG (Customers)
-- =======================================
INSERT INTO KhachHang (TenKH, SdtKH, EmailKH, DiaChiKH, IsDelete) VALUES
('Nguyễn Minh Tuấn', '0912345678', 'tuan.nguyen@email.com', '123 Đường ABC, Quận 1, TP.HCM', 0),
('Trần Thị Lan', '0912345679', 'lan.tran@email.com', '456 Đường XYZ, Quận 2, TP.HCM', 0),
('Lê Văn Hùng', '0912345680', 'hung.le@email.com', '789 Đường DEF, Quận 3, TP.HCM', 0),
('Phạm Thị Mai', '0912345681', 'mai.pham@email.com', '321 Đường GHI, Quận 4, TP.HCM', 0),
('Hoàng Văn Nam', '0912345682', 'nam.hoang@email.com', '654 Đường JKL, Quận 5, TP.HCM', 0),
('Vũ Thị Oanh', '0912345683', 'oanh.vu@email.com', '987 Đường MNO, Quận 6, TP.HCM', 0),
('Đặng Văn Phúc', '0912345684', 'phuc.dang@email.com', '147 Đường PQR, Quận 7, TP.HCM', 0),
('Bùi Thị Quỳnh', '0912345685', 'quynh.bui@email.com', '258 Đường STU, Quận 8, TP.HCM', 0);

-- =======================================
-- 4. SHIPPER
-- =======================================
INSERT INTO Shipper (TenShipper, SdtShipper, DonViGiao, BienSoXe, TrangThai, IsDelete) VALUES
('Nguyễn Văn Giao', '0923456789', 'Giao Hàng Nhanh', '51A-12345', 'Active', 0),
('Trần Văn Vận', '0923456790', 'Giao Hàng Tiết Kiệm', '51B-23456', 'Active', 0),
('Lê Văn Chuyển', '0923456791', 'Viettel Post', '51C-34567', 'Active', 0),
('Phạm Văn Tải', '0923456792', 'J&T Express', '51D-45678', 'Active', 0),
('Hoàng Văn Vận', '0923456793', 'Giao Hàng Nhanh', '51E-56789', 'Active', 0),
('Vũ Văn Chuyển', '0923456794', 'Giao Hàng Tiết Kiệm', '51F-67890', 'Active', 0),
('Đặng Văn Giao', '0923456795', 'Viettel Post', '51G-78901', 'Active', 0),
('Bùi Văn Vận', '0923456796', 'J&T Express', '51H-89012', 'Active', 0);

-- =======================================
-- 5. SẢN PHẨM (Products)
-- Note: MoTa sẽ chứa JSON attributes (VARCHAR(255) - cần đảm bảo JSON ngắn gọn)
-- =======================================
INSERT INTO SanPham (TenSP, GiaSP, SoLuongTonKho, MoTa, MaDanhMuc, IsDelete) VALUES
('Tủ lạnh Samsung 350L', 8990000.00, 15, '{"Màu":"Trắng","Dung tích":"350L","Công nghệ":"Inverter"}', 1, 0),
('Tủ lạnh LG 400L', 10990000.00, 12, '{"Màu":"Bạc","Dung tích":"400L","Công nghệ":"Inverter"}', 1, 0),
('Máy giặt Samsung 10kg', 7990000.00, 20, '{"Công suất":"10kg","Loại":"Cửa trước","Công nghệ":"Inverter"}', 2, 0),
('Máy giặt LG 8kg', 5990000.00, 18, '{"Công suất":"8kg","Loại":"Cửa trên","Công nghệ":"Inverter"}', 2, 0),
('Máy lạnh Daikin 1.5HP', 12990000.00, 10, '{"Công suất":"1.5HP","Loại":"Inverter","Diện tích":"15-20m²"}', 3, 0),
('Máy lạnh Panasonic 1HP', 8990000.00, 14, '{"Công suất":"1HP","Loại":"Inverter","Diện tích":"10-15m²"}', 3, 0),
('Bếp từ Electrolux', 3490000.00, 25, '{"Số vùng":"4 vùng","Công suất":"7200W","Loại":"Cảm ứng"}', 4, 0),
('Bếp từ Sunhouse', 2490000.00, 30, '{"Số vùng":"2 vùng","Công suất":"3600W","Loại":"Cảm ứng"}', 4, 0);

-- =======================================
-- 6. TÀI KHOẢN (Accounts)
-- Password: "password123" hashed with pbkdf2_sha256
-- =======================================
INSERT INTO TaiKhoan (Username, Pass, VaiTro, MaKH, MaNV, IsDelete) VALUES
-- Admin account (linked to first employee)
('admin', '$pbkdf2-sha256$29000$GANASGmNcW6tNaa0FkKI0Q$DTKzly3H/OB.d7nqgd/RfcO3yY5suTffnJKfe6LDLBc', 'Admin', NULL, 1, 0),
-- Manager account
('manager', '$pbkdf2-sha256$29000$x7g3ptR6jxGiNOYcY6w1Jg$ZaG1qr/2dzhMMXU4bTLans9XHPrNkAPisBgnszivx2g', 'NhanVien', NULL, 1, 0),
-- Employee accounts
('nhanvien1', '$pbkdf2-sha256$29000$bE2plZKyVgoBoDRGaA2hdA$CYgzshaQmcUVkV5ct/YiPxjLe4uSYA5lDYS1AisJj38', 'NhanVien', NULL, 2, 0),
('nhanvien2', '$pbkdf2-sha256$29000$DKE0Rggh5Pyf01qrlXJOqQ$FOqz5wqQHMd514iR8bdMOxJegfCjEdhS47mvFuzyM7U', 'NhanVien', NULL, 3, 0),
('nhanvien3', '$pbkdf2-sha256$29000$dm4tpTQmZExJCQEg5ByDcA$NCR2hqGcFPNm.B8Wr0k5AEbrFSyUui/1cuzBDmNTmGE', 'NhanVien', NULL, 4, 0),
-- Customer accounts
('khachhang1', '$pbkdf2-sha256$29000$5vyfEyLk3Hvv3dv7P6f0Hg$FHLKpQgMswp6K3KCaah1KGX80LU5g4Gf/HeAJT18QgY', 'KhachHang', 1, NULL, 0),
('khachhang2', '$pbkdf2-sha256$29000$9B6DcK4VIiSEUGrNGYMwhg$V69Bf/10dgx/lp7MptAjD9Qt36.bPgH6AnlYFhqL76U', 'KhachHang', 2, NULL, 0),
('khachhang3', '$pbkdf2-sha256$29000$rnVuDeHcO6d0rrU2hpAyhg$mJFvfRme5qjisqw8iNpj9uPhEzTOYTUAytwtQHU5uMI', 'KhachHang', 3, NULL, 0);

-- =======================================
-- 7. ĐƠN HÀNG (Orders)
-- =======================================
INSERT INTO DonHang (NgayDat, TongTien, TrangThai, KhuyenMai, PhiShip, MaKH, MaNV, MaShipper) VALUES
('2024-01-15', 8990000.00, 'Pending', NULL, 50000.00, 1, 2, NULL),
('2024-01-16', 10990000.00, 'Confirmed', 10, 50000.00, 2, 3, 1),
('2024-01-17', 7990000.00, 'Processing', NULL, 50000.00, 3, 4, 2),
('2024-01-18', 12990000.00, 'Shipped', 15, 50000.00, 4, 2, 3),
('2024-01-19', 5990000.00, 'Delivered', NULL, 50000.00, 5, 3, 4),
('2024-01-20', 3490000.00, 'Pending', NULL, 30000.00, 6, 4, NULL),
('2024-01-21', 8990000.00, 'Confirmed', 10, 50000.00, 7, 2, 5),
('2024-01-22', 2490000.00, 'Cancelled', NULL, NULL, 8, 3, NULL);

-- =======================================
-- 8. ĐƠN HÀNG - SẢN PHẨM (Order Items)
-- =======================================
INSERT INTO DonHang_SanPham (MaDonHang, MaSP, SoLuong, DonGia, GiamGia) VALUES
(1, 1, 1, 8990000.00, 0.00),
(2, 2, 1, 10990000.00, 1099000.00),
(3, 3, 1, 7990000.00, 0.00),
(4, 5, 1, 12990000.00, 1948500.00),
(5, 4, 1, 5990000.00, 0.00),
(6, 7, 1, 3490000.00, 0.00),
(7, 6, 1, 8990000.00, 899000.00),
(8, 8, 1, 2490000.00, 0.00);

-- =======================================
-- 9. THANH TOÁN (Payments)
-- Note: Schema có TrangThai VARCHAR(30)
-- =======================================
INSERT INTO ThanhToan (PhuongThuc, NgayThanhToan, SoTien, TrangThai, MaDonHang) VALUES
('Tiền mặt', '2024-01-15', 9040000.00, 'Completed', 1),
('Chuyển khoản', '2024-01-16', 9981000.00, 'Completed', 2),
('Thẻ tín dụng', '2024-01-17', 8040000.00, 'Completed', 3),
('Ví điện tử', '2024-01-18', 11041500.00, 'Completed', 4),
('Tiền mặt', '2024-01-19', 6040000.00, 'Completed', 5),
('Chuyển khoản', '2024-01-20', 3520000.00, 'Completed', 6),
('Thẻ tín dụng', '2024-01-21', 8091000.00, 'Completed', 7),
('Tiền mặt', '2024-01-22', 2490000.00, 'Cancelled', 8);

-- =======================================
-- 10. ĐÁNH GIÁ (Reviews)
-- Note: Schema có NgayDanhGia DATE DEFAULT (CURRENT_DATE)
-- =======================================
INSERT INTO DanhGia (NoiDung, DiemDanhGia, NgayDanhGia, IsDelete, MaSP, MaKH) VALUES
('Sản phẩm rất tốt, tiết kiệm điện, dung tích đủ dùng cho gia đình 4 người.', 5, '2024-01-20', 0, 1, 1),
('Tủ lạnh đẹp, chất lượng tốt. Giá hơi cao nhưng đáng đồng tiền.', 4, '2024-01-21', 0, 2, 2),
('Máy giặt hoạt động êm, giặt sạch, tiết kiệm nước và điện.', 5, '2024-01-22', 0, 3, 3),
('Máy giặt tốt, giá hợp lý. Phù hợp cho gia đình nhỏ.', 4, '2024-01-23', 0, 4, 4),
('Máy lạnh làm lạnh nhanh, tiết kiệm điện, thiết kế đẹp.', 5, '2024-01-24', 0, 5, 5),
('Máy lạnh ổn định, giá tốt. Phù hợp phòng ngủ.', 4, '2024-01-25', 0, 6, 6),
('Bếp từ nấu nhanh, dễ vệ sinh, an toàn cho gia đình có trẻ nhỏ.', 5, '2024-01-26', 0, 7, 7),
('Bếp từ giá rẻ nhưng công suất hơi yếu. Phù hợp nấu đơn giản.', 3, '2024-01-27', 0, 8, 8);

-- =======================================
-- 11. KHIẾU NẠI (Complaints)
-- Note: Schema chỉ có: MaKhieuNai, NoiDung, NgayKhieuNai, IsDelete, MaKH
-- =======================================
INSERT INTO KhieuNai (NoiDung, NgayKhieuNai, IsDelete, MaKH) VALUES
('Đơn hàng đã đặt từ 3 ngày nhưng chưa nhận được. Mong được giải quyết sớm.', '2024-01-18', 0, 1),
('Tủ lạnh nhận được có vết xước trên cửa. Yêu cầu đổi sản phẩm mới.', '2024-01-19', 0, 2),
('Máy giặt thiếu ống dẫn nước. Mong được bổ sung sớm.', '2024-01-20', 0, 3),
('Máy lạnh có tiếng ồn lớn khi hoạt động. Không như mô tả.', '2024-01-21', 0, 4),
('Sản phẩm được giao đến địa chỉ khác. Yêu cầu giao lại đúng địa chỉ.', '2024-01-22', 0, 5),
('Bếp từ bị hỏng sau khi sử dụng 1 tuần. Yêu cầu bảo hành.', '2024-01-23', 0, 6),
('Không nhận được hóa đơn VAT. Yêu cầu cung cấp hóa đơn.', '2024-01-24', 0, 7),
('Muốn đổi sản phẩm khác vì không phù hợp nhu cầu.', '2024-01-25', 0, 8);

-- =======================================
-- LƯU Ý: 
-- - Passwords trong TaiKhoan cần được hash bằng pbkdf2_sha256
-- - Để tạo password hash thật, sử dụng Python:
--   from passlib.context import CryptContext
--   pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
--   hash = pwd_context.hash("password123")
-- - Tất cả các bảng trong schema đã được thêm dữ liệu mẫu
-- - Các bảng SystemConfig, Project, SystemLog, ActivityLog không có trong schema
--   nên không được thêm vào file này
-- =======================================
INSERT INTO SanPham (TenSP, GiaSP, SoLuongTonKho, MaDanhMuc, HinhAnh, MoTa) VALUES
('Máy xay sinh tố đa năng Roler RB-4136A', 1899000, 25, 2, 'productimg/mayxaysinhtodanangrolerrb4136a-7a18f5be.jpg', '{"công suất":"1000W","dung tích":"1.5L","màu":"đỏ"}'),
('Nồi cơm điện cao tần Cuckoo CRP-CHSS1009FN', 3999000, 18, 1, 'productimg/noi-com-dien-cuckoo-cr-1030f1-1a092135.jpg', '{"dung tích":"1.8L","công suất":"1400W","chế độ":"đa năng"}'),
('Nồi cơm điện BlueStone RCB-5516', 1299000, 30, 1, 'productimg/noi-com-dien-bluestone-rcb-551-6a33f9cd.jpg', '{"dung tích":"1.8L","lòng nồi":"chống dính","bảo hành":"24 tháng"}'),
('Máy xay sinh tố Vitamix 750', 14490000, 10, 2, 'productimg/may-xay-sinh-to-vitamix-750-s1-71a37c2b.jpg', '{"công suất":"1200W","chức năng":"đánh đá","bình":"Tritan"}'),
('Ấm siêu tốc Sato 30S039', 499000, 40, 3, 'productimg/sato-30s039-f6d17409.jpg', '{"dung tích":"1.7L","ruột":"inox 304","tự ngắt":"có"}'),
('Bộ nồi inox 5 đáy Elmich', 2199000, 22, 4, '/placeholder.svg', '{"chất liệu":"inox 304","đáy":"5 lớp","dùng bếp từ":"có"}'),
('Chảo chống dính sâu lòng Lock&Lock 28cm', 699000, 35, 4, '/placeholder.svg', '{"phủ":"titan","đáy":"từ","tay cầm":"nhựa bakelite"}'),
('Bình giữ nhiệt Elmich 500ml', 349000, 50, 5, '/placeholder.svg', '{"giữ nóng":"12h","giữ lạnh":"18h","chất liệu":"inox 304"}');