# backend/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

from backend.database import get_db
from backend.models import NhanVien, TaiKhoan, KhachHang
from backend.routes.deps import get_current_user
from backend.schemas import RegisterRequest, RegisterCustomerRequest, CustomerRegisterRequest, LoginRequest, TokenResponse, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest

# =====================================================
# 🔐 Auth Router
# =====================================================
router = APIRouter(tags=["Auth"])

# =====================================================
# ⚙️ JWT Configuration
# =====================================================
# SECRET_KEY and ALGORITHM moved to backend.routes.deps to avoid circular import
from backend.routes.deps import SECRET_KEY, ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# =====================================================
# 🧩 Utility Functions
# =====================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu có khớp với hash không"""
    if not hashed_password or not plain_password:
        return False
    
    # Trim whitespace từ cả hai để so sánh chính xác
    plain_password_clean = plain_password.strip()
    hashed_password_clean = str(hashed_password).strip()
    
    # Kiểm tra nếu password trong DB là plain text (chưa được hash)
    # Đây là trường hợp legacy - nên hash lại sau khi verify thành công
    if plain_password_clean == hashed_password_clean:
        return True
    
    # Kiểm tra nếu đã được hash
    try:
        return pwd_context.verify(plain_password_clean, hashed_password_clean)
    except Exception:
        # Hash không hợp lệ hoặc không thể verify
        return False


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
        # Use account.Username instead of phone number
        username = account.Username
    elif hasattr(user, 'MaKH'):  # KhachHang
        user_id = user.MaKH
        # Use account.Username instead of phone number
        username = account.Username
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
@router.post("/register", response_model=UserResponse, summary="Đăng ký tài khoản khách hàng")
def customer_register(request_data: CustomerRegisterRequest, db: Session = Depends(get_db)):
    """
    Đăng ký tài khoản mới cho khách hàng.
    Tạo KhachHang và TaiKhoan với role "KhachHang".
    """
    try:
        # Kiểm tra username đã tồn tại chưa
        existing_account = db.query(TaiKhoan).filter(
            TaiKhoan.Username == request_data.username,
            TaiKhoan.IsDelete == False
        ).first()
        
        if existing_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác."
            )

        # Kiểm tra email đã tồn tại chưa
        existing_customer = db.query(KhachHang).filter(
            KhachHang.EmailKH == request_data.email,
            KhachHang.IsDelete == False
        ).first()
        
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email đã được sử dụng. Vui lòng sử dụng email khác."
            )

        # Kiểm tra số điện thoại đã tồn tại chưa
        existing_phone = db.query(KhachHang).filter(
            KhachHang.SdtKH == request_data.phone,
            KhachHang.IsDelete == False
        ).first()
        
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số điện thoại đã được sử dụng. Vui lòng sử dụng số khác."
            )

        # BƯỚC 1: MÃ HÓA MẬT KHẨU
        hashed_password = get_password_hash(request_data.password)

        # BƯỚC 2: TẠO VÀ LƯU KHÁCH HÀNG
        new_customer = KhachHang(
            TenKH=request_data.fullName,
            SdtKH=request_data.phone,
            EmailKH=request_data.email,
            DiaChiKH=request_data.address,
            IsDelete=False
        )
        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)

        # BƯỚC 3: TẠO VÀ LƯU TÀI KHOẢN
        new_account = TaiKhoan(
            Username=request_data.username,
            Pass=hashed_password,
            VaiTro="KhachHang",  # Use "KhachHang" to match the role name used in login
            MaKH=new_customer.MaKH,
            IsDelete=False
        )
        db.add(new_account)
        db.commit()
        db.refresh(new_account)

        return {
            "MaTK": new_account.MaTK,
            "username": new_account.Username,
            "role": new_account.VaiTro
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi đăng ký tài khoản: {str(e)}"
        )


@router.post("/register/employee", response_model=UserResponse, summary="Đăng ký tài khoản nhân viên (Admin only)")
def register_employee(request_data: RegisterRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Đăng ký tài khoản nhân viên (chỉ dành cho Admin).
    Tạo NhanVien và TaiKhoan.
    """
    # Role check: Only Admin can register employees
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền đăng ký nhân viên"
        )
    
    try:
        # Kiểm tra số điện thoại đã tồn tại chưa
        existing_employee = db.query(NhanVien).filter(
            NhanVien.SdtNV == request_data.SdtNV
        ).first()
        
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số điện thoại đã được sử dụng"
            )

        # BƯỚC 1: MÃ HÓA MẬT KHẨU
        hashed_password = get_password_hash(request_data.password)

        # BƯỚC 2: TẠO VÀ LƯU NHÂN VIÊN
        new_employee = NhanVien(
            TenNV=request_data.TenNV,
            ChucVu=request_data.ChucVu or "Employee",
            SdtNV=request_data.SdtNV,
        )
        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)

        # BƯỚC 3: TẠO VÀ LƯU TÀI KHOẢN
        new_account = TaiKhoan(
            Username=request_data.SdtNV,
            Pass=hashed_password,
            VaiTro=request_data.ChucVu or "Employee",
            MaNV=new_employee.MaNV,
            IsDelete=False
        )
        db.add(new_account)
        db.commit()
        db.refresh(new_account)

        return {
            "MaTK": new_account.MaTK,
            "username": new_account.Username,
            "role": new_account.VaiTro
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi đăng ký nhân viên: {str(e)}"
        )



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


@router.post("/forgot-password", summary="Quên mật khẩu - Gửi link reset")
def forgot_password(request_data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Gửi link đặt lại mật khẩu qua email.
    Trong production, sẽ gửi email thực tế. Hiện tại trả về token để test.
    """
    try:
        # Tìm khách hàng theo email
        customer = db.query(KhachHang).filter(
            KhachHang.EmailKH == request_data.email,
            KhachHang.IsDelete == False
        ).first()
        
        if not customer:
            # Không tiết lộ email có tồn tại hay không (security best practice)
            return {
                "status": "success",
                "message": "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu"
            }
        
        # Tìm tài khoản liên kết
        account = db.query(TaiKhoan).filter(
            TaiKhoan.MaKH == customer.MaKH,
            TaiKhoan.IsDelete == False
        ).first()
        
        if not account:
            return {
                "status": "success",
                "message": "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu"
            }
        
        # Tạo reset token (JWT với expiration 1 giờ)
        expire = datetime.utcnow() + timedelta(hours=1)
        payload = {
            "type": "password_reset",
            "account_id": account.MaTK,
            "exp": expire
        }
        reset_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        # TODO: Trong production, gửi email với link: /reset-password?token={reset_token}
        # Hiện tại trả về token để test (không nên làm trong production)
        return {
            "status": "success",
            "message": "Link đặt lại mật khẩu đã được gửi đến email của bạn",
            "token": reset_token  # Chỉ để test, xóa trong production
        }
    except Exception as e:
        # Không tiết lộ lỗi chi tiết
        return {
            "status": "success",
            "message": "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu"
        }


@router.post("/reset-password", summary="Đặt lại mật khẩu")
def reset_password(request_data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Đặt lại mật khẩu bằng token từ email.
    """
    try:
        # Giải mã token
        try:
            payload = jwt.decode(request_data.token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token đã hết hạn. Vui lòng yêu cầu link mới."
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token không hợp lệ"
            )
        
        # Kiểm tra loại token
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token không hợp lệ"
            )
        
        account_id = payload.get("account_id")
        if not account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token không hợp lệ"
            )
        
        # Tìm tài khoản
        account = db.query(TaiKhoan).filter(
            TaiKhoan.MaTK == account_id,
            TaiKhoan.IsDelete == False
        ).first()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tài khoản không tồn tại"
            )
        
        # Kiểm tra mật khẩu mới
        if len(request_data.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu phải có ít nhất 6 ký tự"
            )
        
        # Cập nhật mật khẩu
        account.Pass = get_password_hash(request_data.new_password)
        db.commit()
        
        return {
            "status": "success",
            "message": "Mật khẩu đã được đặt lại thành công"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi đặt lại mật khẩu: {str(e)}"
        )


@router.post("/change-password", summary="Đổi mật khẩu (yêu cầu đăng nhập)")
def change_password(
    request_data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Đổi mật khẩu cho tài khoản đã đăng nhập.
    Yêu cầu nhập mật khẩu hiện tại và mật khẩu mới.
    """
    try:
        # Lấy account_id từ current_user (có thể là MaTK hoặc account_id hoặc user_id)
        account_id = (
            current_user.get("account_id") or 
            current_user.get("MaTK") or 
            current_user.get("user_id")
        )
        
        if not account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể xác định tài khoản"
            )
        
        # Tìm tài khoản
        account = db.query(TaiKhoan).filter(
            TaiKhoan.MaTK == account_id,
            TaiKhoan.IsDelete == False
        ).first()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tài khoản không tồn tại"
            )
        
        # Kiểm tra mật khẩu hiện tại
        # Trim whitespace từ password nhập vào (cả đầu và cuối)
        current_password_trimmed = request_data.currentPassword.strip()
        
        if not current_password_trimmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng nhập mật khẩu hiện tại"
            )
        
        if not account.Pass:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tài khoản chưa có mật khẩu. Vui lòng sử dụng chức năng đặt lại mật khẩu."
            )
        
        # Verify password (hàm này đã xử lý cả plain text và hashed password)
        password_verified = verify_password(current_password_trimmed, account.Pass)
        
        if not password_verified:
            # Thử thêm một lần nữa với password không trim (để tương thích)
            # Nhưng thường thì nên trim để tránh lỗi do user nhập thừa space
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại mật khẩu bạn đã nhập."
            )
        
        # Kiểm tra mật khẩu mới
        if len(request_data.newPassword) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải có ít nhất 6 ký tự"
            )
        
        # Kiểm tra mật khẩu mới không giống mật khẩu cũ
        if verify_password(request_data.newPassword, account.Pass):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải khác mật khẩu hiện tại"
            )
        
        # Cập nhật mật khẩu
        account.Pass = get_password_hash(request_data.newPassword)
        db.commit()
        
        return {
            "status": "success",
            "message": "Mật khẩu đã được đổi thành công"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi đổi mật khẩu: {str(e)}"
        )
