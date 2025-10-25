from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import NhanVien
from backend.routes.deps import get_current_user
from backend.routes.auth import get_password_hash

router = APIRouter(prefix="/nhanvien", tags=["NhanVien"])

# Create (Admin only)


@router.post("/", response_model=dict)
def create_nhanvien(nhanvien: dict, db: Session = Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    password = nhanvien.get("password")
    hashed = get_password_hash(password) if password else None

    new_nv = NhanVien(
        TenNV=nhanvien.get("TenNV"),
        ChucVu=nhanvien.get("ChucVu"),
        SdtNV=nhanvien.get("SdtNV"),
        hashed_password=hashed
    )
    db.add(new_nv)
    db.commit()
    db.refresh(new_nv)
    return {"MaNV": new_nv.MaNV}

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

    # Allow updating fields; handle password separately
    if "password" in nhanvien:
        nv.hashed_password = get_password_hash(nhanvien.get("password"))
    for key, value in nhanvien.items():
        if key == "password":
            continue
        if hasattr(nv, key):
            setattr(nv, key, value)
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
