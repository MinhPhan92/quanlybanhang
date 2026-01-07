from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    CHAR,
    Text,
    Boolean,
    Enum as SAEnum,
)
from sqlalchemy.dialects.mysql import INTEGER as MySQLInteger
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# Role enum for TaiKhoan.VaiTro
RolesEnum = ("Admin", "NhanVien", "KhachHang")


class KhachHang(Base):
    __tablename__ = "KhachHang"
    MaKH = Column(Integer, primary_key=True, autoincrement=True)
    TenKH = Column(String(100))
    SdtKH = Column(CHAR(15))
    EmailKH = Column(String(100))  # keep name EmailKH to match models usage
    DiaChiKH = Column(String(100))
    IsDelete = Column(Boolean, default=False)
    donhangs = relationship("DonHang", back_populates="khachhang")
    taikhoan = relationship(
        "TaiKhoan", back_populates="khachhang", uselist=False)


class NhanVien(Base):
    __tablename__ = "NhanVien"
    MaNV = Column(Integer, primary_key=True, autoincrement=True)
    TenNV = Column(String(100))
    ChucVu = Column(String(50))
    SdtNV = Column(CHAR(15))
    donhangs = relationship("DonHang", back_populates="nhanvien")
    taikhoan = relationship(
        "TaiKhoan", back_populates="nhanvien", uselist=False)


class DanhMuc(Base):
    __tablename__ = "DanhMuc"
    MaDanhMuc = Column(Integer, primary_key=True, autoincrement=True)
    TenDanhMuc = Column(String(100))
    IsDelete = Column(Boolean, default=False)
    sanphams = relationship("SanPham", back_populates="danhmuc")


class SanPham(Base):
    __tablename__ = "SanPham"
    MaSP = Column(Integer, primary_key=True, autoincrement=True)
    TenSP = Column(String(100))
    GiaSP = Column(Numeric(10, 2))
    SoLuongTonKho = Column(Integer)
    # MoTa stores either free-form description text OR JSON-encoded attributes.
    # Use TEXT to avoid truncation (attributes/description can exceed 255 chars).
    MoTa = Column(Text)
    HinhAnh = Column(String(500))  # URL hoặc đường dẫn ảnh sản phẩm
    MaDanhMuc = Column(Integer, ForeignKey(
        "DanhMuc.MaDanhMuc", onupdate="CASCADE", ondelete="SET NULL"))
    IsDelete = Column(Boolean, default=False)
    danhmuc = relationship("DanhMuc", back_populates="sanphams")
    donhang_sanphams = relationship(
        "DonHang_SanPham", back_populates="sanpham")


# =====================================================
# 📋 ORDER PROCESSING FLOW - DATABASE MODELS
# =====================================================
# SQLAlchemy models representing order-related database tables.
# These models define the structure of order data stored in the database.
# =====================================================

# ORDER FLOW MODEL: DonHang (Order)
# Main order table - stores order header information
class DonHang(Base):
    __tablename__ = "DonHang"
    MaDonHang = Column(Integer, primary_key=True, autoincrement=True)  # Order ID (primary key)
    NgayDat = Column(Date)  # Order date
    TongTien = Column(Numeric(10, 2))  # Total amount (after discount)
    TrangThai = Column(String(50))  # Order status (e.g., "Chờ thanh toán", "Đang xử lý")
    MaKH = Column(Integer, ForeignKey("KhachHang.MaKH",
                  onupdate="CASCADE", ondelete="SET NULL"))  # Customer ID (foreign key)
    MaNV = Column(Integer, ForeignKey("NhanVien.MaNV",
                  onupdate="CASCADE", ondelete="SET NULL"))  # Employee ID (foreign key, nullable)
    KhuyenMai = Column(String(50), nullable=True)  # Discount/promotion info (stored as "X%")
    PhiShip = Column(Numeric(10, 2), nullable=True)  # Shipping fee
    MaShipper = Column(Integer, ForeignKey("Shipper.MaShipper",
                    onupdate="CASCADE", ondelete="SET NULL"), nullable=True)  # Shipper ID (for delivery)
    # Relationships
    khachhang = relationship("KhachHang", back_populates="donhangs")  # Link to customer
    nhanvien = relationship("NhanVien", back_populates="donhangs")  # Link to employee
    donhang_sanphams = relationship(
        "DonHang_SanPham", back_populates="donhang")  # Link to order items
    thanhtoans = relationship("ThanhToan", back_populates="donhang")  # Link to payments
    shipper = relationship("Shipper", back_populates="donhangs")  # Link to shipper


# ORDER FLOW MODEL: DonHang_SanPham (Order Item)
# Junction table linking orders to products
# Stores quantity and price snapshot at order time
class DonHang_SanPham(Base):
    __tablename__ = "DonHang_SanPham"
    MaDonHang = Column(Integer, ForeignKey(
        "DonHang.MaDonHang", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)  # Order ID (part of composite key)
    MaSP = Column(Integer, ForeignKey("SanPham.MaSP",
                  onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)  # Product ID (part of composite key)
    SoLuong = Column(Integer)  # Quantity ordered
    DonGia = Column(Numeric(10, 2))  # Price snapshot at order time (CRITICAL: preserves historical pricing)
    GiamGia = Column(Numeric(10, 2))  # Item-level discount
    # Relationships
    donhang = relationship("DonHang", back_populates="donhang_sanphams")  # Link to order
    sanpham = relationship("SanPham", back_populates="donhang_sanphams")  # Link to product


class ThanhToan(Base):
    __tablename__ = "ThanhToan"
    MaThanhToan = Column(Integer, primary_key=True, autoincrement=True)
    PhuongThuc = Column(String(50))
    NgayThanhToan = Column(Date)
    SoTien = Column(Numeric(10, 2))
    MaDonHang = Column(Integer, ForeignKey(
        "DonHang.MaDonHang", onupdate="CASCADE", ondelete="SET NULL"))
    donhang = relationship("DonHang", back_populates="thanhtoans")


class TaiKhoan(Base):
    __tablename__ = "TaiKhoan"
    MaTK = Column(Integer, primary_key=True, autoincrement=True)
    Username = Column(String(50), unique=True, nullable=False)
    Pass = Column(String(255), nullable=False)  # store hashed password
    VaiTro = Column(SAEnum(*RolesEnum, name="vai_tro_enum"), nullable=True)
    IsDelete = Column(Boolean, default=False)
    MaKH = Column(Integer, ForeignKey("KhachHang.MaKH",
                  onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    MaNV = Column(Integer, ForeignKey("NhanVien.MaNV",
                  onupdate="CASCADE", ondelete="SET NULL"), nullable=True)

    khachhang = relationship("KhachHang", back_populates="taikhoan")
    nhanvien = relationship("NhanVien", back_populates="taikhoan")


class DanhGia(Base):
    __tablename__ = "DanhGia"
    MaDanhGia = Column(Integer, primary_key=True, autoincrement=True)
    MaSP = Column(Integer, ForeignKey("SanPham.MaSP", onupdate="CASCADE", ondelete="CASCADE"))
    MaKH = Column(Integer, ForeignKey("KhachHang.MaKH", onupdate="CASCADE", ondelete="CASCADE"))
    DiemDanhGia = Column(Integer)  # Rating from 1-5
    NoiDung = Column(Text)  # Review content
    NgayDanhGia = Column(DateTime)
    IsDelete = Column(Boolean, default=False)
    
    # Relationships
    sanpham = relationship("SanPham")
    khachhang = relationship("KhachHang")


class KhieuNai(Base):
    __tablename__ = "KhieuNai"
    MaKhieuNai = Column(Integer, primary_key=True, autoincrement=True)
    MaKH = Column(Integer, ForeignKey("KhachHang.MaKH", onupdate="CASCADE", ondelete="CASCADE"))
    NoiDung = Column(String(255))  # Complaint content (matches database VARCHAR(255))
    NgayKhieuNai = Column(Date, default=datetime.now().date())  # Date field (matches database DATE)
    IsDelete = Column(Boolean, default=False)
    
    # Relationships
    khachhang = relationship("KhachHang")


class Shipper(Base):
    __tablename__ = "Shipper"
    MaShipper = Column(Integer, primary_key=True, autoincrement=True)
    TenShipper = Column(String(100))
    SdtShipper = Column(CHAR(15))
    DonViGiao = Column(String(100))
    BienSoXe = Column(String(20))
    TrangThai = Column(String(50))
    IsDelete = Column(Boolean, default=False)
    donhangs = relationship("DonHang", back_populates="shipper")


class SystemLog(Base):
    __tablename__ = "SystemLog"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    Level = Column(String(20))  # INFO, WARNING, ERROR
    Endpoint = Column(String(255))
    Method = Column(String(10))
    StatusCode = Column(Integer)
    RequestBody = Column(Text, nullable=True)
    ResponseBody = Column(Text, nullable=True)
    ErrorMessage = Column(Text, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "ActivityLog"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    UserId = Column(Integer, nullable=True)
    Username = Column(String(100), nullable=True)
    Role = Column(String(50), nullable=True)
    Action = Column(String(100))
    Entity = Column(String(100), nullable=True)
    EntityId = Column(String(100), nullable=True)
    Details = Column(Text, nullable=True)
    IP = Column(String(64), nullable=True)
    UserAgent = Column(String(255), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)


class SystemConfig(Base):
    __tablename__ = "SystemConfig"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    ConfigKey = Column(String(100), unique=True, nullable=False)
    ConfigValue = Column(String(255), nullable=False)
    Description = Column(String(255), nullable=True)
    UpdatedAt = Column(DateTime, default=datetime.utcnow)


# =====================================================
# 📋 Mock Payment Transaction (QR Payment Gateway)
# =====================================================
# Transaction statuses: CREATED, SUCCESS, FAILED, CANCELED

# ORDER FLOW MODEL: PaymentTransaction
# Mock payment transaction for QR payment gateway.
# This simulates a real payment gateway like VNPay/MoMo but fully internal.
# Used when user selects QR payment method in checkout.
class PaymentTransaction(Base):
    """
    Mock payment transaction for QR payment gateway.
    This simulates a real payment gateway like VNPay/MoMo but fully internal.
    """
    __tablename__ = "PaymentTransaction"
    TransactionId = Column(String(50), primary_key=True)  # Unique transaction ID (format: TXN_timestamp_uuid)
    # Use UNSIGNED INTEGER to match DonHang.MaDonHang type
    MaDonHang = Column(MySQLInteger(unsigned=True), ForeignKey("DonHang.MaDonHang", onupdate="CASCADE", ondelete="CASCADE"))  # Order ID (foreign key)
    Amount = Column(Numeric(12, 2), nullable=False)  # Amount to pay (locked to order.TongTien - cannot be modified)
    Status = Column(String(20), default="CREATED")  # Transaction status: CREATED, SUCCESS, FAILED, CANCELED
    Signature = Column(String(255), nullable=True)  # Hash signature for verification (SHA256 hash)
    CreatedAt = Column(DateTime, default=datetime.utcnow)  # Transaction creation timestamp
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # Last update timestamp
    
    # Relationship to order
    donhang = relationship("DonHang")  # Link to order


