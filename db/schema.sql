-- Tạo database
CREATE DATABASE QuanLyBanHang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE QuanLyBanHang;

-- Bảng KhachHang
CREATE TABLE KhachHang (
    MaKH INT AUTO_INCREMENT PRIMARY KEY,
    TenKH VARCHAR(100),
    SdtKH CHAR(15),
    EmailKH VARCHAR(100),
    DiaChiKH VARCHAR(100),
    IsDelete TINYINT(1) DEFAULT 0
);

-- Bảng NhanVien
CREATE TABLE NhanVien (
    MaNV INT AUTO_INCREMENT PRIMARY KEY,
    TenNV VARCHAR(100),
    ChucVu VARCHAR(50),
    SdtNV CHAR(15)
);

-- Bảng DanhMuc
CREATE TABLE DanhMuc (
    MaDanhMuc INT AUTO_INCREMENT PRIMARY KEY,
    TenDanhMuc VARCHAR(100),
    IsDelete TINYINT(1) DEFAULT 0
);

-- Bảng SanPham
CREATE TABLE SanPham (
    MaSP INT AUTO_INCREMENT PRIMARY KEY,
    TenSP VARCHAR(100),
    GiaSP DECIMAL(10,2),
    SoLuongTonKho INT,
    MoTa VARCHAR(255),
    MaDanhMuc INT,
    IsDelete TINYINT(1) DEFAULT 0,
    FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- Bảng DonHang
CREATE TABLE DonHang (
    MaDonHang INT AUTO_INCREMENT PRIMARY KEY,
    NgayDat DATE,
    TongTien DECIMAL(10,2),
    TrangThai VARCHAR(50),
    MaKH INT,
    MaNV INT,
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- Bảng DonHang_SanPham (bảng chi tiết đơn hàng)
CREATE TABLE DonHang_SanPham (
    MaDonHang INT,
    MaSP INT,
    SoLuong INT,
    DonGia DECIMAL(10,2),
    GiamGia DECIMAL(10,2),
    PRIMARY KEY (MaDonHang, MaSP),
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (MaSP) REFERENCES SanPham(MaSP)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Bảng ThanhToan
CREATE TABLE ThanhToan (
    MaThanhToan INT AUTO_INCREMENT PRIMARY KEY,
    PhuongThuc VARCHAR(50),
    NgayThanhToan DATE,
    SoTien DECIMAL(10,2),
    MaDonHang INT,
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
