from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ThanhToan, DonHang
from backend.routes.deps import get_current_user

router = APIRouter(tags=["ThanhToan"])

# Add payment voucher


@router.post("/", response_model=dict)
def add_payment_voucher(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Only Admin, Manager, and Employee can add payment vouchers
    from backend.routes.deps import has_role
    if not has_role(current_user, ["Admin", "Manager", "Employee", "NhanVien"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    madonhang = data.get("MaDonHang")
    phuongthuc = data.get("PhuongThuc")
    ngaythanhtoan = data.get("NgayThanhToan")
    sotien = data.get("SoTien")

    # Check order exists
    donhang = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    if not donhang:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")

    payment = ThanhToan(
        MaDonHang=madonhang,
        PhuongThuc=phuongthuc,
        NgayThanhToan=ngaythanhtoan,
        SoTien=sotien
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"MaThanhToan": payment.MaThanhToan}

# View payment history for an order


@router.get("/history/{madonhang}", response_model=list)
def view_payment_history(madonhang: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Xem lịch sử thanh toán của một đơn hàng.
    """
    payments = db.query(ThanhToan).filter(
        ThanhToan.MaDonHang == madonhang).all()
    
    # Properly serialize SQLAlchemy objects to dictionaries
    result = []
    for p in payments:
        result.append({
            "MaThanhToan": p.MaThanhToan,
            "PhuongThuc": p.PhuongThuc,
            "NgayThanhToan": p.NgayThanhToan.isoformat() if p.NgayThanhToan else None,
            "SoTien": float(p.SoTien) if p.SoTien else 0.0,
            "MaDonHang": p.MaDonHang
        })
    return result
