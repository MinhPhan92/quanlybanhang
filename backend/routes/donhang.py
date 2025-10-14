from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DonHang

router = APIRouter(prefix="/donhang", tags=["DonHang"])

# Create


@router.post("/", response_model=dict)
def create_donhang(donhang: dict, db: Session = Depends(get_db)):
    new_dh = DonHang(
        NgayDat=donhang.get("NgayDat"),
        TongTien=donhang.get("TongTien"),
        TrangThai=donhang.get("TrangThai"),
        MaKH=donhang.get("MaKH"),
        MaNV=donhang.get("MaNV")
    )
    db.add(new_dh)
    db.commit()
    db.refresh(new_dh)
    return {"MaDonHang": new_dh.MaDonHang}

# Read all


@router.get("/", response_model=list)
def get_all_donhang(db: Session = Depends(get_db)):
    dhs = db.query(DonHang).all()
    return [dh.__dict__ for dh in dhs]

# Read one


@router.get("/{madonhang}", response_model=dict)
def get_donhang(madonhang: int, db: Session = Depends(get_db)):
    dh = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    if not dh:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    return dh.__dict__

# Update


@router.put("/{madonhang}", response_model=dict)
def update_donhang(madonhang: int, donhang: dict, db: Session = Depends(get_db)):
    dh = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    if not dh:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    for key, value in donhang.items():
        if hasattr(dh, key):
            setattr(dh, key, value)
    db.commit()
    db.refresh(dh)
    return dh.__dict__

# Delete (hard delete)


@router.delete("/{madonhang}", response_model=dict)
def delete_donhang(madonhang: int, db: Session = Depends(get_db)):
    dh = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    if not dh:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    db.delete(dh)
    db.commit()
    return {"message": "Đã xóa đơn hàng"}
