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
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

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
    MoTa = Column(String(255))
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
    khachhang = relationship("KhachHang", back_populates="donhangs")
    nhanvien = relationship("NhanVien", back_populates="donhangs")
    donhang_sanphams = relationship(
        "DonHang_SanPham", back_populates="donhang")
    thanhtoans = relationship("ThanhToan", back_populates="donhang")


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
    TieuDe = Column(String(200))  # Complaint title
    NoiDung = Column(Text)  # Complaint content
    TrangThai = Column(String(50), default="Pending")  # Pending, Processing, Resolved, Closed
    NgayTao = Column(DateTime)
    NgayCapNhat = Column(DateTime)
    PhanHoi = Column(Text, nullable=True)  # Staff response
    MaNVPhanHoi = Column(Integer, ForeignKey("NhanVien.MaNV", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    IsDelete = Column(Boolean, default=False)
    
    # Relationships
    khachhang = relationship("KhachHang")
    nhanvien_phanhoi = relationship("NhanVien")
