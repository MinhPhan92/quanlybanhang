# backend/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

from backend.database import get_db
from backend.models import NhanVien, TaiKhoan, KhachHang
from backend.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse

# =====================================================
# 🔐 Auth Router
# =====================================================
router = APIRouter(tags=["Auth"])

# =====================================================
# ⚙️ JWT Configuration
# =====================================================
SECRET_KEY = "67PM3"  # ⚠️ Nên lưu trong biến môi trường .env khi deploy
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# =====================================================
# 🧩 Utility Functions
# =====================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu có khớp với hash không"""
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Tạo hash từ mật khẩu"""
    return pwd_context.hash(password)


def create_access_token(user: NhanVien, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Tạo JWT token cho người dùng"""
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {
        "user_id": user.MaNV,
        "username": user.SdtNV or user.TenNV,
        "role": user.ChucVu or "Employee",
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token_from_account(account: TaiKhoan, user, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Tạo JWT token từ tài khoản"""
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)

    # Xác định user_id và username dựa trên loại user
    if hasattr(user, 'MaNV'):  # NhanVien
        user_id = user.MaNV
        username = user.SdtNV or user.TenNV
    elif hasattr(user, 'MaKH'):  # KhachHang
        user_id = user.MaKH
        username = user.SdtKH or user.TenKH
    else:
        user_id = account.MaTK
        username = account.Username

    payload = {
        "user_id": user_id,
        "username": username,
        "role": account.VaiTro or "Employee",
        "account_id": account.MaTK,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# =====================================================
# 🧾 Routes
# =====================================================
@router.post("/register", response_model=UserResponse)
def register_user(request_data: RegisterRequest, db: Session = Depends(get_db)):
    # BƯỚC 1: MÃ HÓA MẬT KHẨU
    hashed_password = get_password_hash(request_data.password)

    # BƯỚC 2: TẠO VÀ LƯU NHÂN VIÊN (lưu hashed_password vào NhanVien)
    new_employee = NhanVien(
        TenNV=request_data.TenNV,
        ChucVu=request_data.ChucVu,
        SdtNV=request_data.SdtNV,
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    # BƯỚC 3: TẠO VÀ LƯU TÀI KHOẢN (lưu hash vào TaiKhoan.Pass)
    new_account = TaiKhoan(
        Username=request_data.SdtNV,
        Pass=hashed_password,
        VaiTro=request_data.ChucVu,
        MaNV=new_employee.MaNV
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return {
        "MaTK": new_account.MaTK,
        "username": new_account.Username,
        "role": new_account.VaiTro
    }


@router.post("/register", response_model=UserResponse)
def customer_register(request_data: RegisterRequest, db: Session = Depends(get_db)):
    # BƯỚC 1: MÃ HÓA MẬT KHẨU
    hashed_password = get_password_hash(request_data.password)

    # BƯỚC 2: TẠO VÀ LƯU KHÁCH HÀNG (lưu hashed_password vào KhachHang)
    new_customer = KhachHang(
        TenKH=request_data.TenKH,
        SdtKH=request_data.SdtKH,
        DiaChi=request_data.DiaChi,
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    # BƯỚC 3: TẠO VÀ LƯU TÀI KHOẢN (lưu hash vào TaiKhoan.Pass)
    new_account = TaiKhoan(
        Username=request_data.SdtKH,
        Pass=hashed_password,
        VaiTro="Customer",
        MaKH=new_customer.MaKH
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return {
        "MaTK": new_account.MaTK,
        "username": new_account.Username,
        "role": new_account.VaiTro
    }


@router.post("/login", response_model=TokenResponse, summary="Đăng nhập hệ thống")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Đăng nhập bằng Username + Mật khẩu.  
    Trả về JWT Token nếu thành công.
    """
    username = credentials.username
    password = credentials.password

    if not username or not password:
        raise HTTPException(
            status_code=400, detail="Username và mật khẩu là bắt buộc")

    # Tìm tài khoản theo username
    account = db.query(TaiKhoan).filter(TaiKhoan.Username ==
                                        username, TaiKhoan.IsDelete == False).first()

    if not account or not verify_password(password, account.Pass):
        raise HTTPException(
            status_code=401, detail="Thông tin đăng nhập không hợp lệ")

    # Lấy thông tin nhân viên hoặc khách hàng
    user = None
    if account.MaNV:
        user = db.query(NhanVien).filter(NhanVien.MaNV == account.MaNV).first()
    elif account.MaKH:
        user = db.query(KhachHang).filter(
            KhachHang.MaKH == account.MaKH).first()

    if not user:
        raise HTTPException(
            status_code=401, detail="Không tìm thấy thông tin người dùng")

    # Tạo token với thông tin từ account
    token = create_access_token_from_account(account, user)

    user_info = {
        "MaTK": account.MaTK,
        "username": account.Username,
        "role": account.VaiTro or "Employee"
    }

    return {
        "status": "success",
        "message": "Đăng nhập thành công",
        "token": token,
        "user": user_info
    }
