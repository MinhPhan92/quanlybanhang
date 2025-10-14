from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import SanPham

router = APIRouter(prefix="/sanpham", tags=["SanPham"])

# Create


@router.post("/", response_model=dict)
def create_sanpham(sanpham: dict, db: Session = Depends(get_db)):
    new_sp = SanPham(
        TenSP=sanpham.get("TenSP"),
        GiaSP=sanpham.get("GiaSP"),
        SoLuongTonKho=sanpham.get("SoLuongTonKho"),
        MoTa=sanpham.get("MoTa"),
        MaDanhMuc=sanpham.get("MaDanhMuc"),
        IsDelete=sanpham.get("IsDelete", 0)
    )
    db.add(new_sp)
    db.commit()
    db.refresh(new_sp)
    return {"MaSP": new_sp.MaSP}

# Read all


@router.get("/", response_model=list)
def get_all_sanpham(db: Session = Depends(get_db)):
    sps = db.query(SanPham).filter(SanPham.IsDelete == 0).all()
    return [sp.__dict__ for sp in sps]

# Read one


@router.get("/{masp}", response_model=dict)
def get_sanpham(masp: int, db: Session = Depends(get_db)):
    sp = db.query(SanPham).filter(SanPham.MaSP ==
                                  masp, SanPham.IsDelete == 0).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    return sp.__dict__

# Update


@router.put("/{masp}", response_model=dict)
def update_sanpham(masp: int, sanpham: dict, db: Session = Depends(get_db)):
    sp = db.query(SanPham).filter(SanPham.MaSP ==
                                  masp, SanPham.IsDelete == 0).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    for key, value in sanpham.items():
        if hasattr(sp, key):
            setattr(sp, key, value)
    db.commit()
    db.refresh(sp)
    return sp.__dict__

# Delete (soft delete)


@router.delete("/{masp}", response_model=dict)
def delete_sanpham(masp: int, db: Session = Depends(get_db)):
    sp = db.query(SanPham).filter(SanPham.MaSP ==
                                  masp, SanPham.IsDelete == 0).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    sp.IsDelete = 1
    db.commit()
    return {"message": "Đã xóa sản phẩm"}
