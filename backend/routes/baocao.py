from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.database import get_db
from backend.models import DonHang, DonHang_SanPham, SanPham

router = APIRouter(prefix="/baocao", tags=["BaoCao"])

# Revenue report (total revenue in a period)


@router.get("/revenue", response_model=dict)
def revenue_report(
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db)
):
    total = db.query(func.sum(DonHang.TongTien)).filter(
        DonHang.NgayDat >= start_date,
        DonHang.NgayDat <= end_date
    ).scalar() or 0
    return {"total_revenue": float(total)}

# Orders report (total orders in a period)


@router.get("/orders", response_model=dict)
def orders_report(
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db)
):
    count = db.query(func.count(DonHang.MaDonHang)).filter(
        DonHang.NgayDat >= start_date,
        DonHang.NgayDat <= end_date
    ).scalar() or 0
    return {"total_orders": count}

# Best-selling products (top N products by quantity sold)


@router.get("/best_selling", response_model=list)
def best_selling_products(
    top: int = 5,
    db: Session = Depends(get_db)
):
    results = db.query(
        SanPham.TenSP,
        func.sum(DonHang_SanPham.SoLuong).label("total_sold")
    ).join(DonHang_SanPham, SanPham.MaSP == DonHang_SanPham.MaSP)\
     .group_by(SanPham.MaSP, SanPham.TenSP)\
     .order_by(desc("total_sold"))\
     .limit(top).all()
    return [{"TenSP": r.TenSP, "SoLuongBan": int(r.total_sold)} for r in results]

# Inventory report (products low in stock)


@router.get("/low_inventory", response_model=list)
def low_inventory_products(
    threshold: int = 10,
    db: Session = Depends(get_db)
):
    products = db.query(SanPham).filter(
        SanPham.SoLuongTonKho <= threshold,
        SanPham.IsDelete == 0
    ).all()
    return [
        {
            "MaSP": p.MaSP,
            "TenSP": p.TenSP,
            "SoLuongTonKho": p.SoLuongTonKho
        }
        for p in products
    ]
