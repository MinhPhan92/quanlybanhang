-- =======================================
-- DATABASE CREATION SCRIPT
-- QuanLyBanHang - Complete Database Schema
-- =======================================

-- Create database
CREATE DATABASE IF NOT EXISTS QuanLyBanHang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE QuanLyBanHang;

-- =======================================
-- BẢNG KHÁCH HÀNG
-- =======================================
CREATE TABLE KhachHang (
    MaKH INT AUTO_INCREMENT PRIMARY KEY,
    TenKH VARCHAR(100),
    SdtKH CHAR(15),
    EmailKH VARCHAR(100),
    DiaChiKH VARCHAR(100),
    IsDelete BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG NHÂN VIÊN
-- =======================================
CREATE TABLE NhanVien (
    MaNV INT AUTO_INCREMENT PRIMARY KEY,
    TenNV VARCHAR(100),
    ChucVu VARCHAR(50),
    SdtNV CHAR(15)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG DANH MỤC
-- =======================================
CREATE TABLE DanhMuc (
    MaDanhMuc INT AUTO_INCREMENT PRIMARY KEY,
    TenDanhMuc VARCHAR(100),
    IsDelete BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG SẢN PHẨM
-- =======================================
CREATE TABLE SanPham (
    MaSP INT AUTO_INCREMENT PRIMARY KEY,
    TenSP VARCHAR(100),
    GiaSP DECIMAL(10, 2),
    SoLuongTonKho INT,
    MoTa TEXT,  -- TEXT để lưu JSON attributes hoặc mô tả dài
    HinhAnh VARCHAR(500),  -- URL hoặc đường dẫn ảnh sản phẩm
    MaDanhMuc INT,
    IsDelete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_danhmuc (MaDanhMuc),
    INDEX idx_isdelete (IsDelete)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG SHIPPER
-- =======================================
CREATE TABLE Shipper (
    MaShipper INT AUTO_INCREMENT PRIMARY KEY,
    TenShipper VARCHAR(100),
    SdtShipper CHAR(15),
    DonViGiao VARCHAR(100),
    BienSoXe VARCHAR(20),
    TrangThai VARCHAR(50),
    IsDelete BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG ĐƠN HÀNG
-- =======================================
CREATE TABLE DonHang (
    MaDonHang INT AUTO_INCREMENT PRIMARY KEY,
    NgayDat DATE,
    TongTien DECIMAL(10, 2),
    TrangThai VARCHAR(50),
    MaKH INT,
    MaNV INT,
    KhuyenMai VARCHAR(50) NULL,  -- Voucher code field
    PhiShip DECIMAL(10, 2) NULL,
    MaShipper INT NULL,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaShipper) REFERENCES Shipper(MaShipper)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_makh (MaKH),
    INDEX idx_trangthai (TrangThai),
    INDEX idx_ngaydat (NgayDat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG ĐƠN HÀNG - SẢN PHẨM (Chi tiết đơn hàng)
-- =======================================
CREATE TABLE DonHang_SanPham (
    MaDonHang INT,
    MaSP INT,
    SoLuong INT,
    DonGia DECIMAL(10, 2),  -- Price snapshot at order time
    GiamGia DECIMAL(10, 2),
    PRIMARY KEY (MaDonHang, MaSP),
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_masp (MaSP)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG THANH TOÁN
-- =======================================
CREATE TABLE ThanhToan (
    MaThanhToan INT AUTO_INCREMENT PRIMARY KEY,
    PhuongThuc VARCHAR(50),
    NgayThanhToan DATE,
    SoTien DECIMAL(10, 2),
    MaDonHang INT,
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_madonhang (MaDonHang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG TÀI KHOẢN
-- =======================================
CREATE TABLE TaiKhoan (
    MaTK INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Pass VARCHAR(255) NOT NULL,  -- Hashed password
    VaiTro ENUM('Admin', 'NhanVien', 'KhachHang'),
    IsDelete BOOLEAN DEFAULT FALSE,
    MaKH INT NULL,
    MaNV INT NULL,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_username (Username),
    INDEX idx_vaitro (VaiTro),
    INDEX idx_makh (MaKH),
    INDEX idx_manv (MaNV)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG ĐÁNH GIÁ (Reviews)
-- =======================================
CREATE TABLE DanhGia (
    MaDanhGia INT AUTO_INCREMENT PRIMARY KEY,
    MaSP INT,
    MaKH INT,
    DiemDanhGia INT,  -- Rating from 1-5
    NoiDung TEXT,  -- Review content
    NgayDanhGia DATETIME,
    IsDelete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_masp (MaSP),
    INDEX idx_makh (MaKH),
    INDEX idx_diem (DiemDanhGia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG KHIẾU NẠI (Complaints)
-- =======================================
CREATE TABLE KhieuNai (
    MaKhieuNai INT AUTO_INCREMENT PRIMARY KEY,
    MaKH INT,
    NoiDung VARCHAR(255),  -- Complaint content
    NgayKhieuNai DATE DEFAULT (CURRENT_DATE),
    IsDelete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_makh (MaKH)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG PAYMENT TRANSACTION (QR Payment Gateway)
-- =======================================
CREATE TABLE PaymentTransaction (
    TransactionId VARCHAR(50) PRIMARY KEY,  -- Unique transaction ID (TXN_YYYYMMDD_XXXXXXXX)
    MaDonHang INT UNSIGNED,  -- Foreign key to DonHang
    Amount DECIMAL(12, 2) NOT NULL,  -- Payment amount (locked to order total)
    Status VARCHAR(20) DEFAULT 'CREATED',  -- CREATED, SUCCESS, FAILED, CANCELED
    Signature VARCHAR(255),  -- Hash signature for verification
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_order (MaDonHang),
    INDEX idx_status (Status),
    INDEX idx_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG SYSTEM LOG (Hệ thống logging)
-- =======================================
CREATE TABLE SystemLog (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Level VARCHAR(20),  -- INFO, WARNING, ERROR
    Endpoint VARCHAR(255),
    Method VARCHAR(10),
    StatusCode INT,
    RequestBody TEXT NULL,
    ResponseBody TEXT NULL,
    ErrorMessage TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level (Level),
    INDEX idx_endpoint (Endpoint),
    INDEX idx_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG ACTIVITY LOG (Nhật ký hoạt động)
-- =======================================
CREATE TABLE ActivityLog (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NULL,
    Username VARCHAR(100) NULL,
    Role VARCHAR(50) NULL,
    Action VARCHAR(100),
    Entity VARCHAR(100) NULL,
    EntityId VARCHAR(100) NULL,
    Details TEXT NULL,
    IP VARCHAR(64) NULL,
    UserAgent VARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_userid (UserId),
    INDEX idx_action (Action),
    INDEX idx_entity (Entity),
    INDEX idx_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- BẢNG SYSTEM CONFIG (Cấu hình hệ thống)
-- =======================================
CREATE TABLE SystemConfig (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ConfigKey VARCHAR(100) UNIQUE NOT NULL,
    ConfigValue VARCHAR(255) NOT NULL,
    Description VARCHAR(255) NULL,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_configkey (ConfigKey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================
-- END OF DATABASE CREATION
-- =======================================

