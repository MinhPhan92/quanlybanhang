from typing import Optional, Dict, List, Any
from pydantic import BaseModel
from datetime import datetime
import json


class RegisterRequest(BaseModel):
    SdtNV: str
    password: str
    TenNV: Optional[str] = None
    ChucVu: Optional[str] = "Employee"


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    MaTK: int
    username: str
    role: str


class TokenResponse(BaseModel):
    status: str
    message: str
    token: str
    user: Dict


# =====================================================
# 📋 Review (DanhGia) Schemas
# =====================================================

class ReviewCreateRequest(BaseModel):
    MaSP: int
    DiemDanhGia: int  # Rating from 1-5
    NoiDung: str

class ReviewResponse(BaseModel):
    MaDanhGia: int
    MaSP: int
    MaKH: int
    DiemDanhGia: int
    NoiDung: str
    NgayDanhGia: datetime
    TenKH: Optional[str] = None
    TenSP: Optional[str] = None

class ReviewListResponse(BaseModel):
    reviews: List[ReviewResponse]
    total: int
    average_rating: Optional[float] = None

# =====================================================
# 📋 Complaint (KhieuNai) Schemas
# =====================================================

class ComplaintCreateRequest(BaseModel):
    TieuDe: str
    NoiDung: str

class ComplaintResponse(BaseModel):
    MaKhieuNai: int
    MaKH: int
    TieuDe: str
    NoiDung: str
    TrangThai: str
    NgayTao: datetime
    NgayCapNhat: Optional[datetime] = None
    PhanHoi: Optional[str] = None
    MaNVPhanHoi: Optional[int] = None
    TenKH: Optional[str] = None
    TenNVPhanHoi: Optional[str] = None

class ComplaintUpdateRequest(BaseModel):
    TrangThai: Optional[str] = None
    PhanHoi: Optional[str] = None

class ComplaintListResponse(BaseModel):
    complaints: List[ComplaintResponse]
    total: int

# =====================================================
# 📋 Product (SanPham) Schemas with Attributes
# =====================================================

class ProductCreateRequest(BaseModel):
    TenSP: str
    GiaSP: float
    SoLuongTonKho: int
    MoTa: Optional[str] = None
    MaDanhMuc: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None  # JSON attributes field

class ProductUpdateRequest(BaseModel):
    TenSP: Optional[str] = None
    GiaSP: Optional[float] = None
    SoLuongTonKho: Optional[int] = None
    MoTa: Optional[str] = None
    MaDanhMuc: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None  # JSON attributes field

class ProductResponse(BaseModel):
    MaSP: int
    TenSP: str
    GiaSP: float
    SoLuongTonKho: int
    MoTa: Optional[str] = None
    MaDanhMuc: Optional[int] = None
    IsDelete: bool = False
    attributes: Optional[Dict[str, Any]] = None  # Decoded JSON attributes
    TenDanhMuc: Optional[str] = None  # Category name

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int

# =====================================================
# 📋 Contact (LienHe) Schemas
# =====================================================

class ContactCreateRequest(BaseModel):
    HoTen: str
    Email: str
    SoDienThoai: Optional[str] = None
    ChuDe: str
    NoiDung: str

class ContactResponse(BaseModel):
    MaLienHe: int
    HoTen: str
    Email: str
    SoDienThoai: Optional[str] = None
    ChuDe: str
    NoiDung: str
    TrangThai: str
    NgayGui: datetime
    GhiChu: Optional[str] = None

class ContactListResponse(BaseModel):
    contacts: List[ContactResponse]
    total: int