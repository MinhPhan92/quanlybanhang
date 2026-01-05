from typing import Optional, Dict, List, Any
from pydantic import BaseModel
from datetime import datetime, date
import json


class RegisterRequest(BaseModel):
    SdtNV: str
    password: str
    TenNV: Optional[str] = None
    ChucVu: Optional[str] = "Employee"


class RegisterCustomerRequest(BaseModel):
    SdtKH: str
    password: str
    TenKH: str
    EmailKH: Optional[str] = None
    DiaChiKH: Optional[str] = None


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
    HinhAnh: Optional[str] = None  # URL hoặc đường dẫn ảnh sản phẩm
    MaDanhMuc: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None  # JSON attributes field

class ProductUpdateRequest(BaseModel):
    TenSP: Optional[str] = None
    GiaSP: Optional[float] = None
    SoLuongTonKho: Optional[int] = None
    MoTa: Optional[str] = None
    HinhAnh: Optional[str] = None  # URL hoặc đường dẫn ảnh sản phẩm
    MaDanhMuc: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None  # JSON attributes field

class ProductResponse(BaseModel):
    MaSP: int
    TenSP: str
    GiaSP: float
    SoLuongTonKho: int
    MoTa: Optional[str] = None
    HinhAnh: Optional[str] = None  # URL hoặc đường dẫn ảnh sản phẩm
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


# =====================================================
# 📋 Mock Payment Transaction Schemas (QR Payment Gateway)
# =====================================================
# These schemas support the mock QR payment flow similar to VNPay/MoMo sandbox

class CreateTransactionRequest(BaseModel):
    """Request to create a new payment transaction for an order."""
    orderId: int  # MaDonHang - the order to pay for
    # Note: amount is NOT user-editable - it's fetched from order.TongTien

class CreateTransactionResponse(BaseModel):
    """Response after creating a transaction - includes QR payment URL."""
    transactionId: str
    orderId: int
    amount: float
    paymentUrl: str  # Format: /mock-pay/{transactionId}
    status: str  # CREATED

class TransactionInfoResponse(BaseModel):
    """Transaction details for display on mock payment page."""
    transactionId: str
    orderId: int
    amount: float
    status: str
    createdAt: datetime
    signature: Optional[str] = None

class PaymentCallbackRequest(BaseModel):
    """Callback from mock payment page after user action."""
    transactionId: str
    result: str  # SUCCESS, FAILED, CANCELED
    signature: str  # For verification: hash(transactionId + amount + SECRET)

class PaymentCallbackResponse(BaseModel):
    """Response after processing payment callback."""
    success: bool
    message: str
    transactionId: str
    orderId: int
    orderStatus: str  # New order status (PAID, PENDING_PAYMENT, etc.)
    redirectUrl: str  # Where to redirect user after payment