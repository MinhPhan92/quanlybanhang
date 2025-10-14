from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import NhanVien
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Auth"])

# Secret key for JWT (change to your own secret in production)
SECRET_KEY = "67PM3"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dummy user password storage (replace with real DB field in production)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def authenticate_user(db: Session, sdt: str, password: str):
    user = db.query(NhanVien).filter(NhanVien.SdtNV == sdt).first()
    if not user or not hasattr(user, "hashed_password"):
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/login", response_model=dict)
def login(form_data: dict, db: Session = Depends(get_db)):
    sdt = form_data.get("SdtNV")
    password = form_data.get("password")
    user = db.query(NhanVien).filter(NhanVien.SdtNV == sdt).first()
    if not user or not hasattr(user, "hashed_password"):
        raise HTTPException(
            status_code=400, detail="Thông tin đăng nhập không đúng")
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=400, detail="Thông tin đăng nhập không đúng")
    access_token = create_access_token(data={"sub": str(user.MaNV)})
    return {"access_token": access_token, "token_type": "bearer"}

# Register (for demo, add hashed_password field to NhanVien)


@router.post("/register", response_model=dict)
def register(data: dict, db: Session = Depends(get_db)):
    sdt = data.get("SdtNV")
    password = data.get("password")
    ten = data.get("TenNV")
    chucvu = data.get("ChucVu")
    if db.query(NhanVien).filter(NhanVien.SdtNV == sdt).first():
        raise HTTPException(status_code=400, detail="Số điện thoại đã tồn tại")
    hashed_password = get_password_hash(password)
    new_nv = NhanVien(
        TenNV=ten,
        ChucVu=chucvu,
        SdtNV=sdt,
        hashed_password=hashed_password  # You must add this field to your model
    )
    db.add(new_nv)
    db.commit()
    db.refresh(new_nv)
    return {"MaNV": new_nv.MaNV, "message": "Đăng ký thành công"}

# You need to add 'hashed_password = Column(String(255))' to NhanVien model for this to work.
