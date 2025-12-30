from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DonHang_SanPham, DonHang, SanPham
from backend.routes.deps import get_current_user

router = APIRouter(tags=["ChiTietDonHang"])

# Add products to order


@router.post("/", response_model=dict)
def add_product_to_order(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Only Admin, Manager, and Employee can add products to orders
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    madonhang = data.get("MaDonHang")
    masp = data.get("MaSP")
    soluong = data.get("SoLuong")
    dongia = data.get("DonGia")
    giamgia = data.get("GiamGia", 0)

    # Check order and product exist
    donhang = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    sanpham = db.query(SanPham).filter(SanPham.MaSP == masp).first()
    if not donhang or not sanpham:
        raise HTTPException(
            status_code=404, detail="Đơn hàng hoặc sản phẩm không tồn tại")

    # Add or update product in order
    chitiet = db.query(DonHang_SanPham).filter(
        DonHang_SanPham.MaDonHang == madonhang,
        DonHang_SanPham.MaSP == masp
    ).first()
    if chitiet:
        chitiet.SoLuong += soluong
        chitiet.DonGia = dongia
        chitiet.GiamGia = giamgia
    else:
        chitiet = DonHang_SanPham(
            MaDonHang=madonhang,
            MaSP=masp,
            SoLuong=soluong,
            DonGia=dongia,
            GiamGia=giamgia
        )
        db.add(chitiet)
    db.commit()
    update_total_price(madonhang, db)
    return {"message": "Đã thêm sản phẩm vào đơn hàng"}

# Update total price of order


def update_total_price(madonhang: int, db: Session):
    chitiets = db.query(DonHang_SanPham).filter(
        DonHang_SanPham.MaDonHang == madonhang).all()
    tongtien = 0
    for ct in chitiets:
        tongtien += (ct.DonGia - ct.GiamGia) * ct.SoLuong
    donhang = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    if donhang:
        donhang.TongTien = tongtien
        db.commit()

# Optionally: update product in order


@router.put("/", response_model=dict)
def update_product_in_order(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Only Admin, Manager, and Employee can update order details
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    madonhang = data.get("MaDonHang")
    masp = data.get("MaSP")
    soluong = data.get("SoLuong")
    dongia = data.get("DonGia")
    giamgia = data.get("GiamGia", 0)

    chitiet = db.query(DonHang_SanPham).filter(
        DonHang_SanPham.MaDonHang == madonhang,
        DonHang_SanPham.MaSP == masp
    ).first()
    if not chitiet:
        raise HTTPException(
            status_code=404, detail="Chi tiết đơn hàng không tồn tại")
    chitiet.SoLuong = soluong
    chitiet.DonGia = dongia
    chitiet.GiamGia = giamgia
    db.commit()
    update_total_price(madonhang, db)
    return {"message": "Đã cập nhật sản phẩm trong đơn hàng"}
