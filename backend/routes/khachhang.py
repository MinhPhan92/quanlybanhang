from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import KhachHang
from backend.routes.deps import get_current_user

router = APIRouter(prefix="/khachhang", tags=["KhachHang"])

# Create


@router.post("/", response_model=dict)
def create_khachhang(khachhang: dict, db: Session = Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    # example role check: only Admin can create
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    new_kh = KhachHang(
        TenKH=khachhang.get("TenKH"),
        SdtKH=khachhang.get("SdtKH"),
        EmailKH=khachhang.get("EmailKH"),
        DiaChiKH=khachhang.get("DiaChiKH"),
        IsDelete=khachhang.get("IsDelete", 0)
    )
    db.add(new_kh)
    db.commit()
    db.refresh(new_kh)
    return {"MaKH": new_kh.MaKH}

# Read all


@router.get("/", response_model=list)
def get_all_khachhang(db: Session = Depends(get_db),
                      current_user: dict = Depends(get_current_user)):
    khs = db.query(KhachHang).filter(KhachHang.IsDelete == 0).all()
    return [kh.__dict__ for kh in khs]

# Read one


@router.get("/{makh}", response_model=dict)
def get_khachhang(makh: int, db: Session = Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    kh = db.query(KhachHang).filter(KhachHang.MaKH ==
                                    makh, KhachHang.IsDelete == 0).first()
    if not kh:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    return kh.__dict__

# Update


@router.put("/{makh}", response_model=dict)
def update_khachhang(makh: int, khachhang: dict, db: Session = Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    kh = db.query(KhachHang).filter(KhachHang.MaKH ==
                                    makh, KhachHang.IsDelete == 0).first()
    if not kh:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    # optional role check: only Admin or owner (implement as needed)
    for key, value in khachhang.items():
        if hasattr(kh, key):
            setattr(kh, key, value)
    db.commit()
    db.refresh(kh)
    return kh.__dict__

# Delete (soft delete)


@router.delete("/{makh}", response_model=dict)
def delete_khachhang(makh: int, db: Session = Depends(get_db),
                     current_user: dict = Depends(get_current_user)):
    kh = db.query(KhachHang).filter(KhachHang.MaKH ==
                                    makh, KhachHang.IsDelete == 0).first()
    if not kh:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    kh.IsDelete = 1
    db.commit()
    return {"message": "Đã xóa khách hàng"}
