from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DonHang, Shipper
from backend.routes.deps import get_current_user
from backend.utils.promotion_data import VoucherData
from backend.utils.inventory_manager import InventoryManager, InventoryError
from pydantic import BaseModel
from typing import Optional
from backend.utils.activity_logger import log_activity

router = APIRouter(tags=["DonHang"])

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


class DeliveryUpdateRequest(BaseModel):
    delivery_status: str
    shipper_id: Optional[int] = None
    shipper_name: Optional[str] = None
    shipper_phone: Optional[str] = None
    shipper_company: Optional[str] = None
    shipper_plate: Optional[str] = None
    shipping_fee: Optional[float] = None


class DeliveryUpdateResponse(BaseModel):
    success: bool
    message: str
    order_id: int
    delivery_status: str
    shipper_id: Optional[int] = None

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

    # Activity log
    try:
        log_activity(
            db,
            current_user,
            action="CREATE",
            entity="DonHang",
            entity_id=new_dh.MaDonHang,
            details=f"Created order with final amount {float(new_dh.TongTien)}",
        )
    except Exception:
        pass
    
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
    """
    Lấy danh sách tất cả đơn hàng.
    Chỉ Admin, Manager, và Employee mới có thể xem.
    """
    try:
        dhs = db.query(DonHang).all()
        # Properly serialize SQLAlchemy objects to dictionaries
        result = []
        for dh in dhs:
            order_dict = {
                "MaDonHang": dh.MaDonHang,
                "NgayDat": dh.NgayDat.isoformat() if dh.NgayDat else None,
                "TongTien": float(dh.TongTien) if dh.TongTien else 0.0,
                "TrangThai": dh.TrangThai,
                "MaKH": dh.MaKH,
                "MaNV": dh.MaNV,
                "KhuyenMai": dh.KhuyenMai,
                "PhiShip": float(dh.PhiShip) if dh.PhiShip else None,
                "MaShipper": dh.MaShipper,
            }
            result.append(order_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách đơn hàng: {str(e)}"
        )

# Read one


@router.get("/{madonhang}", response_model=dict)
def get_donhang(madonhang: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Lấy thông tin chi tiết một đơn hàng.
    """
    try:
        dh = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
        if not dh:
            raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
        
        # Properly serialize SQLAlchemy object to dictionary
        return {
            "MaDonHang": dh.MaDonHang,
            "NgayDat": dh.NgayDat.isoformat() if dh.NgayDat else None,
            "TongTien": float(dh.TongTien) if dh.TongTien else 0.0,
            "TrangThai": dh.TrangThai,
            "MaKH": dh.MaKH,
            "MaNV": dh.MaNV,
            "KhuyenMai": dh.KhuyenMai,
            "PhiShip": float(dh.PhiShip) if dh.PhiShip else None,
            "MaShipper": dh.MaShipper,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thông tin đơn hàng: {str(e)}"
        )

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

    # Activity log
    try:
        log_activity(
            db,
            current_user,
            action="UPDATE",
            entity="DonHang",
            entity_id=dh.MaDonHang,
            details="Updated order fields",
        )
    except Exception:
        pass
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

    # Activity log
    try:
        log_activity(
            db,
            current_user,
            action="DELETE",
            entity="DonHang",
            entity_id=madonhang,
            details="Deleted order",
        )
    except Exception:
        pass
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

        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="UPDATE_STATUS",
                entity="DonHang",
                entity_id=order.MaDonHang,
                details=f"Status: {old_status} -> {new_status}",
            )
        except Exception:
            pass
        
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


# =====================================================
# 🚚 Delivery status and shipper assignment/update
# =====================================================


@router.put("/{madonhang}/delivery", response_model=DeliveryUpdateResponse, summary="Cập nhật giao hàng: trạng thái & shipper")
def update_delivery(
    madonhang: int,
    request: DeliveryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Role check: Only Admin, Manager, and Employee can update delivery info
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )

    try:
        order = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn hàng không tồn tại")

        # Handle shipper assignment or update
        shipper_id = request.shipper_id
        created_shipper = None
        if shipper_id:
            shipper = db.query(Shipper).filter(Shipper.MaShipper == shipper_id, Shipper.IsDelete == False).first()
            if not shipper:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipper không tồn tại")
        else:
            shipper = None
            if request.shipper_name or request.shipper_phone:
                shipper = Shipper(
                    TenShipper=request.shipper_name,
                    SdtShipper=request.shipper_phone,
                    DonViGiao=request.shipper_company,
                    BienSoXe=request.shipper_plate,
                    TrangThai="Active",
                    IsDelete=False,
                )
                db.add(shipper)
                db.commit()
                db.refresh(shipper)
                created_shipper = shipper

        # Assign shipper to order if any
        if shipper_id or created_shipper is not None:
            order.MaShipper = shipper_id or created_shipper.MaShipper

        # Update delivery status and shipping fee if provided
        if request.delivery_status:
            order.TrangThai = request.delivery_status
        if request.shipping_fee is not None:
            order.PhiShip = request.shipping_fee

        db.commit()

        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="UPDATE_DELIVERY",
                entity="DonHang",
                entity_id=order.MaDonHang,
                details=f"Status={request.delivery_status}; Shipper={order.MaShipper}; Fee={request.shipping_fee}",
            )
        except Exception:
            pass

        return DeliveryUpdateResponse(
            success=True,
            message="Đã cập nhật thông tin giao hàng",
            order_id=order.MaDonHang,
            delivery_status=order.TrangThai,
            shipper_id=order.MaShipper,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật giao hàng: {str(e)}"
        )
