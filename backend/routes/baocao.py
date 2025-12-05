from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Dict, List
from backend.database import get_db
from backend.models import DonHang, DonHang_SanPham, SanPham, KhachHang, DanhMuc
from backend.routes.deps import get_current_user

router = APIRouter(tags=["BaoCao"])

# Revenue report (total revenue in a period)


@router.get("/revenue", response_model=dict)
def revenue_report(
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Role check: Only Admin and Manager can view revenue reports
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Role check: Only Admin and Manager can view order reports
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    count = db.query(func.count(DonHang.MaDonHang)).filter(
        DonHang.NgayDat >= start_date,
        DonHang.NgayDat <= end_date
    ).scalar() or 0
    return {"total_orders": count}

# Best-selling products (top N products by quantity sold)


@router.get("/best_selling", response_model=list)
def best_selling_products(
    top: int = 5,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Role check: Only Admin and Manager can view best-selling reports
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Role check: Only Admin and Manager can view inventory reports
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
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

# Dashboard Summary (for admin dashboard)
@router.get("/summary", response_model=dict)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get dashboard summary with key metrics and recent data.
    Only Admin and Manager can access.
    """
    # Role check: Only Admin and Manager can view dashboard
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        # Get today's date
        today = datetime.now().date()
        start_of_month = today.replace(day=1)
        
        # Orders today
        orders_today = db.query(func.count(DonHang.MaDonHang)).filter(
            func.date(DonHang.NgayDat) == today
        ).scalar() or 0
        
        # Total products
        total_products = db.query(func.count(SanPham.MaSP)).filter(
            SanPham.IsDelete == False
        ).scalar() or 0
        
        # Total customers
        total_customers = db.query(func.count(KhachHang.MaKH)).filter(
            KhachHang.IsDelete == False
        ).scalar() or 0
        
        # Recent orders (last 5)
        recent_orders = db.query(DonHang).join(
            KhachHang, DonHang.MaKH == KhachHang.MaKH
        ).order_by(desc(DonHang.NgayDat)).limit(5).all()
        
        recent_orders_data = [
            {
                "id": order.MaDonHang,
                "code": f"DH{order.MaDonHang:04d}",
                "customer_name": order.khachhang.TenKH if order.khachhang else "N/A",
                "total": float(order.TongTien) if order.TongTien else 0,
                "status": order.TrangThai,
                "created_at": order.NgayDat.isoformat() if order.NgayDat else None
            }
            for order in recent_orders
        ]
        
        # Monthly sales (last 3 months)
        monthly_sales = []
        for i in range(2, -1, -1):  # Last 3 months
            month_start = (start_of_month - timedelta(days=30 * i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_revenue = db.query(func.sum(DonHang.TongTien)).filter(
                DonHang.NgayDat >= month_start,
                DonHang.NgayDat <= month_end
            ).scalar() or 0
            
            monthly_sales.append({
                "name": f"T{month_start.month}",
                "sales": float(month_revenue)
            })
        
        # New products (last 5, based on ID as proxy for newness)
        new_products = db.query(SanPham).filter(
            SanPham.IsDelete == False
        ).order_by(desc(SanPham.MaSP)).limit(5).all()
        
        new_products_data = []
        for product in new_products:
            # Parse attributes for image
            image = "/placeholder.svg"
            if product.MoTa:
                try:
                    import json
                    attrs = json.loads(product.MoTa)
                    image = attrs.get("image") or attrs.get("images", [""])[0] or "/placeholder.svg"
                except:
                    pass
            
            new_products_data.append({
                "id": product.MaSP,
                "name": product.TenSP,
                "price": f"{product.GiaSP:,.0f}" if product.GiaSP else "0",
                "image": image
            })
        
        return {
            "orders_today": orders_today,
            "total_products": total_products,
            "total_customers": total_customers,
            "recent_orders": recent_orders_data,
            "monthly_sales": monthly_sales,
            "new_products": new_products_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating dashboard summary: {str(e)}"
        )
