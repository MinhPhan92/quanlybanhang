-- =======================================
-- TẠO DATABASE
-- =======================================
-- CREATE DATABASE QuanLyBanHang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE QuanLyBanHang;

-- =======================================
-- BẢNG KHÁCH HÀNG
-- =======================================
CREATE TABLE KhachHang (
    MaKH INT AUTO_INCREMENT PRIMARY KEY,
    TenKH VARCHAR(100),
    SdtKH VARCHAR(15),
    EmailKH VARCHAR(100),
    DiaChiKH VARCHAR(255),
    IsDelete BOOLEAN DEFAULT 0
);

-- =======================================
-- BẢNG NHÂN VIÊN
-- =======================================
CREATE TABLE NhanVien (
    MaNV INT AUTO_INCREMENT PRIMARY KEY,
    TenNV VARCHAR(100),
    ChucVu VARCHAR(50),
    SdtNV VARCHAR(15)
);

-- =======================================
-- BẢNG DANH MỤC
-- =======================================
CREATE TABLE DanhMuc (
    MaDanhMuc INT AUTO_INCREMENT PRIMARY KEY,
    TenDanhMuc VARCHAR(100),
    IsDelete BOOLEAN DEFAULT 0
);

-- =======================================
-- BẢNG SẢN PHẨM
-- =======================================
CREATE TABLE SanPham (
    MaSP INT AUTO_INCREMENT PRIMARY KEY,
    TenSP VARCHAR(100),
    GiaSP DECIMAL(10,2),
    SoLuongTonKho INT,
    MoTa VARCHAR(255),
    MaDanhMuc INT,
    IsDelete BOOLEAN DEFAULT 0,
    FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =======================================
-- BẢNG SHIPPER
-- =======================================
CREATE TABLE Shipper (
    MaShipper INT AUTO_INCREMENT PRIMARY KEY,
    TenShipper VARCHAR(100),
    SdtShipper VARCHAR(15),
    DonViGiao VARCHAR(100),
    BienSoXe VARCHAR(20),
    TrangThai VARCHAR(50),
    IsDelete BOOLEAN DEFAULT 0
);

-- =======================================
-- BẢNG ĐƠN HÀNG
-- =======================================
CREATE TABLE DonHang (
    MaDonHang INT AUTO_INCREMENT PRIMARY KEY,
    NgayDat DATE,
    TongTien DECIMAL(10,2),
    TrangThai VARCHAR(50),
    KhuyenMai INT,
    PhiShip DECIMAL(10,2),
    MaKH INT,
    MaNV INT,
    MaShipper INT,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaShipper) REFERENCES Shipper(MaShipper)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =======================================
-- BẢNG ĐƠN HÀNG - SẢN PHẨM
-- =======================================
CREATE TABLE DonHang_SanPham (
    MaDonHang INT,
    MaSP INT,
    SoLuong INT,
    DonGia DECIMAL(10,2),
    GiamGia FLOAT,
    PRIMARY KEY (MaDonHang, MaSP),
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =======================================
-- BẢNG THANH TOÁN
-- =======================================
CREATE TABLE ThanhToan (
    MaThanhToan INT AUTO_INCREMENT PRIMARY KEY,
    PhuongThuc VARCHAR(50),
    NgayThanhToan DATE,
    SoTien DECIMAL(10,2),
    TrangThai VARCHAR(30),
    MaDonHang INT,
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =======================================
-- BẢNG TÀI KHOẢN
-- =======================================
CREATE TABLE TaiKhoan (
    MaTK INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Pass VARCHAR(255) NOT NULL,
    VaiTro ENUM('Admin', 'NhanVien', 'KhachHang'),
    IsDelete BOOLEAN DEFAULT 0,
    MaKH INT NULL,
    MaNV INT NULL,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =======================================
-- BẢNG ĐÁNH GIÁ
-- =======================================
CREATE TABLE DanhGia (
    MaDanhGia INT AUTO_INCREMENT PRIMARY KEY,
    NoiDung VARCHAR(255),
    DiemDanhGia TINYINT CHECK (DiemDanhGia BETWEEN 1 AND 5),
    NgayDanhGia DATE DEFAULT (CURRENT_DATE),
    IsDelete BOOLEAN DEFAULT 0,
    MaSP INT,
    MaKH INT,
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =======================================
-- BẢNG KHIẾU NẠI
-- =======================================
CREATE TABLE KhieuNai (
    MaKhieuNai INT AUTO_INCREMENT PRIMARY KEY,
    NoiDung VARCHAR(255),
    NgayKhieuNai DATE DEFAULT (CURRENT_DATE),
    IsDelete BOOLEAN DEFAULT 0,
    MaKH INT,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);
