from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DonHang
from backend.routes.deps import get_current_user
from backend.utils.promotion_data import VoucherData
from backend.utils.inventory_manager import InventoryManager, InventoryError
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/donhang", tags=["DonHang"])

# =====================================================
# 📋 Request/Response Models
# =====================================================

class StatusUpdateRequest(BaseModel):
    new_status: str
    old_status: Optional[str] = None

class StatusUpdateResponse(BaseModel):
    success: bool
    message: str
    order_id: int
    old_status: str
    new_status: str
    inventory_updated: bool

# Create


@router.post("/", response_model=dict)
def create_donhang(donhang: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Only Admin, Manager, and Employee can create orders
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    # Extract voucher code from payload
    voucher_code = donhang.get("voucher_code")
    original_amount = donhang.get("TongTien", 0)
    final_amount = original_amount
    applied_voucher = None
    
    # Process voucher if provided
    if voucher_code:
        # Validate and calculate discount
        is_valid, error_msg = VoucherData.is_voucher_valid(voucher_code, original_amount)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Mã giảm giá không hợp lệ: {error_msg}"
            )
        
        # Calculate discount amount
        discount_amount, calc_error = VoucherData.calculate_discount(voucher_code, original_amount)
        if calc_error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Lỗi tính toán giảm giá: {calc_error}"
            )
        
        # Apply discount
        final_amount = original_amount - discount_amount
        applied_voucher = voucher_code
        
        # Mark voucher as used (in real system, this would update database)
        VoucherData.use_voucher(voucher_code)
    
    # Create order with voucher information
    new_dh = DonHang(
        NgayDat=donhang.get("NgayDat"),
        TongTien=final_amount,  # Use final amount after discount
        TrangThai=donhang.get("TrangThai"),
        MaKH=donhang.get("MaKH"),
        MaNV=donhang.get("MaNV"),
        KhuyenMai=applied_voucher  # Store voucher code
    )
    db.add(new_dh)
    db.commit()
    db.refresh(new_dh)
    
    # Return order info with voucher details
    response = {
        "MaDonHang": new_dh.MaDonHang,
        "TongTien": float(new_dh.TongTien),
        "KhuyenMai": new_dh.KhuyenMai
    }
    
    # Add discount information if voucher was applied
    if applied_voucher:
        discount_amount = original_amount - final_amount
        response.update({
            "original_amount": original_amount,
            "discount_amount": discount_amount,
            "voucher_applied": True
        })
    else:
        response["voucher_applied"] = False
    
    return response

# Read all


@router.get("/", response_model=list)
def get_all_donhang(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    dhs = db.query(DonHang).all()
    return [dh.__dict__ for dh in dhs]

# Read one


@router.get("/{madonhang}", response_model=dict)
def get_donhang(madonhang: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    dh = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    if not dh:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    return dh.__dict__

# Update


@router.put("/{madonhang}", response_model=dict)
def update_donhang(madonhang: int, donhang: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Only Admin, Manager, and Employee can update orders
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
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
def delete_donhang(madonhang: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Only Admin can delete orders
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    dh = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
    if not dh:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    db.delete(dh)
    db.commit()
    return {"message": "Đã xóa đơn hàng"}

# =====================================================
# 📦 Status Update with Inventory Management
# =====================================================

@router.put("/{madonhang}/status", response_model=StatusUpdateResponse, summary="Cập nhật trạng thái đơn hàng")
def update_order_status(
    madonhang: int,
    request: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật trạng thái đơn hàng và xử lý tồn kho an toàn.
    Sử dụng transaction để đảm bảo tính nhất quán dữ liệu.
    """
    # Role check: Only Admin, Manager, and Employee can update order status
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        # Get current order
        order = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Đơn hàng không tồn tại"
            )
        
        old_status = order.TrangThai
        new_status = request.new_status
        
        # Validate status transition
        valid_statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {', '.join(valid_statuses)}"
            )
        
        # Handle inventory changes with transaction safety
        inventory_success, inventory_message = InventoryManager.handle_inventory_change(
            db, madonhang, new_status, old_status
        )
        
        if not inventory_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lỗi cập nhật tồn kho: {inventory_message}"
            )
        
        # Update order status
        order.TrangThai = new_status
        db.commit()
        
        return StatusUpdateResponse(
            success=True,
            message=f"Đã cập nhật trạng thái đơn hàng từ '{old_status}' thành '{new_status}'",
            order_id=madonhang,
            old_status=old_status,
            new_status=new_status,
            inventory_updated=True
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi không mong muốn: {str(e)}"
        )

@router.get("/{madonhang}/inventory-check", response_model=dict, summary="Kiểm tra tồn kho cho đơn hàng")
def check_order_inventory(
    madonhang: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Kiểm tra tồn kho có đủ cho đơn hàng không.
    """
    # Role check: Only Admin, Manager, and Employee can check inventory
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        # Get order items
        from backend.models import DonHang_SanPham, SanPham
        
        order_items = db.query(DonHang_SanPham).filter(
            DonHang_SanPham.MaDonHang == madonhang
        ).all()
        
        if not order_items:
            return {
                "order_id": madonhang,
                "has_items": False,
                "message": "Đơn hàng không có sản phẩm"
            }
        
        # Check stock availability
        items_data = [
            {"MaSP": item.MaSP, "SoLuong": item.SoLuong}
            for item in order_items
        ]
        
        is_available, message, insufficient_items = InventoryManager.check_stock_availability(
            db, items_data
        )
        
        return {
            "order_id": madonhang,
            "has_items": True,
            "stock_available": is_available,
            "message": message,
            "insufficient_items": insufficient_items if not is_available else []
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi kiểm tra tồn kho: {str(e)}"
        )
