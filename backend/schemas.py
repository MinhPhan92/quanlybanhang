from typing import Optional, Dict, List, Any
from pydantic import BaseModel
from datetime import datetime, date
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
    TieuDe: Optional[str] = None  # Optional, for API compatibility (not stored in DB)
    NoiDung: str  # Only NoiDung exists in database

class ComplaintResponse(BaseModel):
    MaKhieuNai: int
    MaKH: int
    NoiDung: str
    NgayKhieuNai: Optional[date] = None  # Matches database column name
    TenKH: Optional[str] = None  # Added from relationship
    # Virtual fields for compatibility (not in database but computed)
    TieuDe: Optional[str] = None  # Will be generated from MaKhieuNai
    TrangThai: Optional[str] = "Pending"  # Default value, not in DB
    NgayTao: Optional[datetime] = None  # Will map from NgayKhieuNai
    NgayCapNhat: Optional[datetime] = None  # Will map from NgayKhieuNai
    PhanHoi: Optional[str] = None  # Not in DB, always None
    MaNVPhanHoi: Optional[int] = None  # Not in DB, always None
    TenNVPhanHoi: Optional[str] = None  # Not in DB, always None

class ComplaintUpdateRequest(BaseModel):
    # Since these fields don't exist in DB, we'll just update NoiDung if needed
    NoiDung: Optional[str] = None
    TrangThai: Optional[str] = None  # For API compatibility, but won't be saved
    PhanHoi: Optional[str] = None  # For API compatibility, but won't be saved

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