from sqlalchemy import Column, Integer, String, DECIMAL, Date, ForeignKey, CHAR, Text, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class KhachHang(Base):
    __tablename__ = "KhachHang"
    MaKH = Column(Integer, primary_key=True, autoincrement=True)
    TenKH = Column(String(100))
    SdtKH = Column(CHAR(15))
    EmailKH = Column(String(100))
    DiaChiKH = Column(String(100))
    IsDelete = Column(SmallInteger, default=0)
    donhangs = relationship("DonHang", back_populates="khachhang")


class NhanVien(Base):
    __tablename__ = "NhanVien"
    MaNV = Column(Integer, primary_key=True, autoincrement=True)
    TenNV = Column(String(100))
    ChucVu = Column(String(50))
    SdtNV = Column(CHAR(15))
    donhangs = relationship("DonHang", back_populates="nhanvien")


class DanhMuc(Base):
    __tablename__ = "DanhMuc"
    MaDanhMuc = Column(Integer, primary_key=True, autoincrement=True)
    TenDanhMuc = Column(String(100))
    IsDelete = Column(SmallInteger, default=0)
    sanphams = relationship("SanPham", back_populates="danhmuc")


class SanPham(Base):
    __tablename__ = "SanPham"
    MaSP = Column(Integer, primary_key=True, autoincrement=True)
    TenSP = Column(String(100))
    GiaSP = Column(DECIMAL(10, 2))
    SoLuongTonKho = Column(Integer)
    MoTa = Column(String(255))
    MaDanhMuc = Column(Integer, ForeignKey(
        "DanhMuc.MaDanhMuc", onupdate="CASCADE", ondelete="SET NULL"))
    IsDelete = Column(SmallInteger, default=0)
    danhmuc = relationship("DanhMuc", back_populates="sanphams")
    donhang_sanphams = relationship(
        "DonHang_SanPham", back_populates="sanpham")


class DonHang(Base):
    __tablename__ = "DonHang"
    MaDonHang = Column(Integer, primary_key=True, autoincrement=True)
    NgayDat = Column(Date)
    TongTien = Column(DECIMAL(10, 2))
    TrangThai = Column(String(50))
    MaKH = Column(Integer, ForeignKey("KhachHang.MaKH",
                  onupdate="CASCADE", ondelete="SET NULL"))
    MaNV = Column(Integer, ForeignKey("NhanVien.MaNV",
                  onupdate="CASCADE", ondelete="SET NULL"))
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
    DonGia = Column(DECIMAL(10, 2))
    GiamGia = Column(DECIMAL(10, 2))
    donhang = relationship("DonHang", back_populates="donhang_sanphams")
    sanpham = relationship("SanPham", back_populates="donhang_sanphams")


class ThanhToan(Base):
    __tablename__ = "ThanhToan"
    MaThanhToan = Column(Integer, primary_key=True, autoincrement=True)
    PhuongThuc = Column(String(50))
    NgayThanhToan = Column(Date)
    SoTien = Column(DECIMAL(10, 2))
    MaDonHang = Column(Integer, ForeignKey(
        "DonHang.MaDonHang", onupdate="CASCADE", ondelete="CASCADE"))
    donhang = relationship("DonHang", back_populates="thanhtoans")
