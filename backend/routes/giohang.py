"""
Cart/Shopping Cart API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from backend.database import get_db
from backend.routes.deps import get_current_user
from backend.models import SanPham

router = APIRouter()


class CartItemRequest(BaseModel):
    sanPhamId: int
    soLuong: int = 1


class CartItemResponse(BaseModel):
    sanPhamId: int
    tenSP: str
    giaSP: float
    soLuong: int
    thanhTien: float


@router.post("/giohang/add", tags=["Giỏ hàng"])
def add_to_cart(
    item: CartItemRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Thêm sản phẩm vào giỏ hàng
    """
    # Verify product exists and is not deleted
    product = db.query(SanPham).filter(
        SanPham.MaSP == item.sanPhamId,
        SanPham.IsDelete == False
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    # Check stock availability
    if product.SoLuongTonKho < item.soLuong:
        raise HTTPException(
            status_code=400,
            detail=f"Không đủ hàng trong kho. Chỉ còn {product.SoLuongTonKho} sản phẩm"
        )

    # Calculate total price
    thanh_tien = float(product.GiaSP) * item.soLuong

    return {
        "message": "Đã thêm sản phẩm vào giỏ hàng",
        "cartItem": {
            "sanPhamId": product.MaSP,
            "tenSP": product.TenSP,
            "giaSP": float(product.GiaSP),
            "soLuong": item.soLuong,
            "thanhTien": thanh_tien,
        }
    }


@router.get("/giohang", tags=["Giỏ hàng"])
def get_cart(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Lấy danh sách sản phẩm trong giỏ hàng
    Note: This is a placeholder - actual cart should be stored in session/database
    """
    return {
        "message": "Giỏ hàng của bạn",
        "items": []
    }


@router.delete("/giohang/{sanPhamId}", tags=["Giỏ hàng"])
def remove_from_cart(
    sanPhamId: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Xóa sản phẩm khỏi giỏ hàng
    """
    return {
        "message": f"Đã xóa sản phẩm {sanPhamId} khỏi giỏ hàng"
    }

