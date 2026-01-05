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


class DonHang(Base):
    __tablename__ = "DonHang"
    MaDonHang = Column(Integer, primary_key=True, autoincrement=True)
    NgayDat = Column(Date)
    TongTien = Column(Numeric(10, 2))
    TrangThai = Column(String(50))
    MaKH = Column(Integer, ForeignKey("KhachHang.MaKH",
                  onupdate="CASCADE", ondelete="SET NULL"))
    MaNV = Column(Integer, ForeignKey("NhanVien.MaNV",
                  onupdate="CASCADE", ondelete="SET NULL"))
    KhuyenMai = Column(String(50), nullable=True)  # Voucher code field
    PhiShip = Column(Numeric(10, 2), nullable=True)
    MaShipper = Column(Integer, ForeignKey("Shipper.MaShipper",
                    onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    khachhang = relationship("KhachHang", back_populates="donhangs")
    nhanvien = relationship("NhanVien", back_populates="donhangs")
    donhang_sanphams = relationship(
        "DonHang_SanPham", back_populates="donhang")
    thanhtoans = relationship("ThanhToan", back_populates="donhang")
    shipper = relationship("Shipper", back_populates="donhangs")


class DonHang_SanPham(Base):
    __tablename__ = "DonHang_SanPham"
    MaDonHang = Column(Integer, ForeignKey(
        "DonHang.MaDonHang", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
    MaSP = Column(Integer, ForeignKey("SanPham.MaSP",
                  onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
    SoLuong = Column(Integer)
    DonGia = Column(Numeric(10, 2))
    GiamGia = Column(Numeric(10, 2))
    donhang = relationship("DonHang", back_populates="donhang_sanphams")
    sanpham = relationship("SanPham", back_populates="donhang_sanphams")


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

class PaymentTransaction(Base):
    """
    Mock payment transaction for QR payment gateway.
    This simulates a real payment gateway like VNPay/MoMo but fully internal.
    """
    __tablename__ = "PaymentTransaction"
    TransactionId = Column(String(50), primary_key=True)  # UUID-like unique ID
    # Use UNSIGNED INTEGER to match DonHang.MaDonHang type
    MaDonHang = Column(MySQLInteger(unsigned=True), ForeignKey("DonHang.MaDonHang", onupdate="CASCADE", ondelete="CASCADE"))
    Amount = Column(Numeric(12, 2), nullable=False)  # Amount to pay (locked to order.TongTien)
    Status = Column(String(20), default="CREATED")  # CREATED, SUCCESS, FAILED, CANCELED
    Signature = Column(String(255), nullable=True)  # Hash signature for verification
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to order
    donhang = relationship("DonHang")


