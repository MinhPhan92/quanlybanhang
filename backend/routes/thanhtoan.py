from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ThanhToan, DonHang

router = APIRouter(prefix="/thanhtoan", tags=["ThanhToan"])

# Add payment voucher


@router.post("/", response_model=dict)
def add_payment_voucher(data: dict, db: Session = Depends(get_db)):
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
def view_payment_history(madonhang: int, db: Session = Depends(get_db)):
    payments = db.query(ThanhToan).filter(
        ThanhToan.MaDonHang == madonhang).all()
    return [p.__dict__ for p in payments]
