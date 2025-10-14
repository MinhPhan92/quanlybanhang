from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import NhanVien

router = APIRouter(prefix="/nhanvien", tags=["NhanVien"])

# Create


@router.post("/", response_model=dict)
def create_nhanvien(nhanvien: dict, db: Session = Depends(get_db)):
    new_nv = NhanVien(
        TenNV=nhanvien.get("TenNV"),
        ChucVu=nhanvien.get("ChucVu"),
        SdtNV=nhanvien.get("SdtNV")
    )
    db.add(new_nv)
    db.commit()
    db.refresh(new_nv)
    return {"MaNV": new_nv.MaNV}

# Read all


@router.get("/", response_model=list)
def get_all_nhanvien(db: Session = Depends(get_db)):
    nvs = db.query(NhanVien).all()
    return [nv.__dict__ for nv in nvs]

# Read one


@router.get("/{manv}", response_model=dict)
def get_nhanvien(manv: int, db: Session = Depends(get_db)):
    nv = db.query(NhanVien).filter(NhanVien.MaNV == manv).first()
    if not nv:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
    return nv.__dict__

# Update


@router.put("/{manv}", response_model=dict)
def update_nhanvien(manv: int, nhanvien: dict, db: Session = Depends(get_db)):
    nv = db.query(NhanVien).filter(NhanVien.MaNV == manv).first()
    if not nv:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
    for key, value in nhanvien.items():
        if hasattr(nv, key):
            setattr(nv, key, value)
    db.commit()
    db.refresh(nv)
    return nv.__dict__

# Delete (hard delete)


@router.delete("/{manv}", response_model=dict)
def delete_nhanvien(manv: int, db: Session = Depends(get_db)):
    nv = db.query(NhanVien).filter(NhanVien.MaNV == manv).first()
    if not nv:
        raise HTTPException(status_code=404, detail="Nhân viên không tồn tại")
    db.delete(nv)
    db.commit()
    return {"message": "Đã xóa nhân viên"}
