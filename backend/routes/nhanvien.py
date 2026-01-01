from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import NhanVien, TaiKhoan
from backend.routes.deps import get_current_user
from backend.routes.auth import get_password_hash

router = APIRouter(tags=["NhanVien"])

# Create (Admin only)


@router.post("/", response_model=dict)
def create_nhanvien(nhanvien: dict, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    password = nhanvien.get("password")
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu là bắt buộc"
        )
    
    # Step 1: Create NhanVien record
    new_nv = NhanVien(
        TenNV=nhanvien.get("TenNV"),
        ChucVu=nhanvien.get("ChucVu"),
        SdtNV=nhanvien.get("SdtNV")
    )
    db.add(new_nv)
    db.commit()
    db.refresh(new_nv)
    
    # Step 2: Create TaiKhoan record for the employee
    hashed_password = get_password_hash(password)
    
    # Generate username: use provided username, or generate from employee name + ID
    # Format: "tennv_manv" (e.g., "nguyenvana_5")
    if nhanvien.get("username"):
        username = nhanvien.get("username")
    else:
        # Generate username from employee name (remove spaces, convert to lowercase, add ID)
        name_part = "".join(nhanvien.get("TenNV", "").split()).lower()[:10]  # First 10 chars, no spaces
        if not name_part:
            name_part = "nv"
        username = f"{name_part}_{new_nv.MaNV}"
    
    # Check if username already exists
    existing_account = db.query(TaiKhoan).filter(TaiKhoan.Username == username).first()
    if existing_account:
        # If username exists, append employee ID
        username = f"{username}{new_nv.MaNV}"
    
    new_account = TaiKhoan(
        Username=username,
        Pass=hashed_password,
        VaiTro="NhanVien",  # Default role for employees
        MaNV=new_nv.MaNV
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    return {"MaNV": new_nv.MaNV, "MaTK": new_account.MaTK, "username": new_account.Username}

# Read all


@router.get("/", response_model=list)
def get_all_nhanvien(db: Session = Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    nvs = db.query(NhanVien).all()
    result = []
    for nv in nvs:
        result.append({
            "MaNV": nv.MaNV,
            "TenNV": nv.TenNV,
            "ChucVu": nv.ChucVu,
            "SdtNV": nv.SdtNV
        })
    return result

# Read one


@router.get("/{manv}", response_model=dict)
def get_nhanvien(manv: int, db: Session = Depends(get_db),
                 current_user: dict = Depends(get_current_user)):
    nv = db.query(NhanVien).filter(NhanVien.MaNV == manv).first()
    if not nv:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
    return {
        "MaNV": nv.MaNV,
        "TenNV": nv.TenNV,
        "ChucVu": nv.ChucVu,
        "SdtNV": nv.SdtNV
    }

# Update (Admin only)


@router.put("/{manv}", response_model=dict)
def update_nhanvien(manv: int, nhanvien: dict, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    nv = db.query(NhanVien).filter(NhanVien.MaNV == manv).first()
    if not nv:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")

    # Update NhanVien fields
    for key, value in nhanvien.items():
        if key == "password" or key == "username":
            continue
        if hasattr(nv, key):
            setattr(nv, key, value)
    
    # Handle password update - update in TaiKhoan
    if "password" in nhanvien and nhanvien.get("password"):
        account = db.query(TaiKhoan).filter(TaiKhoan.MaNV == manv).first()
        if account:
            account.Pass = get_password_hash(nhanvien.get("password"))
        else:
            # If no account exists, create one
            username = nhanvien.get("username") or nv.SdtNV or f"nv{manv}"
            existing_account = db.query(TaiKhoan).filter(TaiKhoan.Username == username).first()
            if existing_account:
                username = f"{username}{manv}"
            
            new_account = TaiKhoan(
                Username=username,
                Pass=get_password_hash(nhanvien.get("password")),
                VaiTro="NhanVien",
                MaNV=manv
            )
            db.add(new_account)
    
    db.commit()
    db.refresh(nv)
    return {
        "MaNV": nv.MaNV,
        "TenNV": nv.TenNV,
        "ChucVu": nv.ChucVu,
        "SdtNV": nv.SdtNV
    }

# Delete (hard delete, Admin only)


@router.delete("/{manv}", response_model=dict)
def delete_nhanvien(manv: int, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    nv = db.query(NhanVien).filter(NhanVien.MaNV == manv).first()
    if not nv:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
    db.delete(nv)
    db.commit()
    return {"message": "Đã xóa nhân viên"}
