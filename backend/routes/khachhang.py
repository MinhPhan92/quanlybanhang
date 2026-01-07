from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import KhachHang
from backend.routes.deps import get_current_user

router = APIRouter(tags=["KhachHang"])

def serialize_khachhang(kh: KhachHang) -> dict:
    """Serialize KhachHang object to dictionary, excluding SQLAlchemy internal state."""
    return {
        "MaKH": kh.MaKH,
        "TenKH": kh.TenKH,
        "SdtKH": kh.SdtKH,
        "EmailKH": kh.EmailKH,
        "DiaChiKH": kh.DiaChiKH,
        "IsDelete": bool(kh.IsDelete) if kh.IsDelete is not None else False
    }

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
    return [serialize_khachhang(kh) for kh in khs]

# Get current customer's info
@router.get("/me", response_model=dict)
def get_my_info(db: Session = Depends(get_db),
                current_user: dict = Depends(get_current_user)):
    """Get current customer's information"""
    account_id = current_user.get("account_id") or current_user.get("MaTK")
    if not account_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    from backend.models import TaiKhoan
    account = db.query(TaiKhoan).filter(TaiKhoan.MaTK == account_id).first()
    if not account or not account.MaKH:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin khách hàng")
    
    kh = db.query(KhachHang).filter(KhachHang.MaKH == account.MaKH, KhachHang.IsDelete == 0).first()
    if not kh:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    return serialize_khachhang(kh)

# Update current customer's info
@router.put("/me", response_model=dict)
def update_my_info(khachhang: dict, db: Session = Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    """Update current customer's information"""
    account_id = current_user.get("account_id") or current_user.get("MaTK")
    if not account_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    from backend.models import TaiKhoan
    account = db.query(TaiKhoan).filter(TaiKhoan.MaTK == account_id).first()
    if not account or not account.MaKH:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin khách hàng")
    
    kh = db.query(KhachHang).filter(KhachHang.MaKH == account.MaKH, KhachHang.IsDelete == 0).first()
    if not kh:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    
    # Update allowed fields
    allowed_fields = ["TenKH", "SdtKH", "EmailKH", "DiaChiKH"]
    for key, value in khachhang.items():
        if key in allowed_fields and hasattr(kh, key):
            setattr(kh, key, value)
    
    db.commit()
    db.refresh(kh)
    return serialize_khachhang(kh)

# Read one


@router.get("/{makh}", response_model=dict)
def get_khachhang(makh: int, db: Session = Depends(get_db),
                  current_user: dict = Depends(get_current_user)):
    kh = db.query(KhachHang).filter(KhachHang.MaKH ==
                                    makh, KhachHang.IsDelete == 0).first()
    if not kh:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
    return serialize_khachhang(kh)

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
    return serialize_khachhang(kh)

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
