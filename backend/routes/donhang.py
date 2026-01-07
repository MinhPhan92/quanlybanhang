# =====================================================
# 📋 ORDER PROCESSING FLOW - STEP 4: BACKEND ORDER ROUTES
# =====================================================
# Backend API endpoints for order management.
# This is where orders are actually created and stored in database.
# Flow:
# 1. create_donhang() - Creates DonHang and DonHang_SanPham records
# 2. get_all_donhang() - Retrieves orders (filtered by user role)
# 3. get_donhang() - Gets single order with items
# 4. update_order_status() - Updates status and manages inventory
# 5. update_delivery() - Updates shipping info and shipper assignment
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DonHang, Shipper
from backend.routes.deps import get_current_user
# Removed VoucherData import - using direct discount percentage instead
from backend.utils.inventory_manager import InventoryManager, InventoryError
from pydantic import BaseModel
from typing import Optional
from backend.utils.activity_logger import log_activity
from datetime import datetime, date

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


# ORDER FLOW STEP 4.1: Create new order
# Called from checkout page via POST /api/donhang/
# This is the main order creation endpoint
@router.post("/", response_model=dict)
def create_donhang(donhang: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # ORDER FLOW STEP 4.1.1: Validate user permissions
    # Admin, Manager, Employee can create any orders
    # KhachHang can only create orders for themselves
    user_role = current_user.get("role")
    
    if user_role not in ["Admin", "Manager", "Employee", "KhachHang"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    # ORDER FLOW STEP 4.1.2: Security check for customers
    # If customer is creating order, ensure MaKH matches their account
    # Prevents customers from creating orders for other customers
    if user_role == "KhachHang":
        # Get customer ID from token (stored as user_id for customers)
        customer_id_from_token = current_user.get("user_id")
        # Override MaKH to prevent customers from creating orders for others
        donhang["MaKH"] = customer_id_from_token
    
    # ORDER FLOW STEP 4.1.3: Process discount
    # Extract discount percentage from payload and calculate final amount
    discount_percentage = donhang.get("discount_percentage")
    original_amount = donhang.get("TongTien", 0)
    final_amount = original_amount
    applied_discount = None
    
    # Process discount percentage if provided
    if discount_percentage is not None:
        try:
            discount_percentage = float(discount_percentage)
            # Validate discount percentage (0-100)
            if discount_percentage < 0 or discount_percentage > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phần trăm giảm giá phải từ 0 đến 100"
                )
            
            # Calculate discount amount from percentage
            if discount_percentage > 0:
                discount_amount = (original_amount * discount_percentage) / 100
                final_amount = original_amount - discount_amount
                applied_discount = discount_percentage
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phần trăm giảm giá không hợp lệ"
            )
    
    # ORDER FLOW STEP 4.1.4: Parse order date
    # Convert ISO datetime string to date object
    ngay_dat_str = donhang.get("NgayDat")
    if ngay_dat_str:
        # If it's an ISO datetime string, parse it and extract date
        if isinstance(ngay_dat_str, str):
            try:
                # Parse ISO datetime string and extract date part
                ngay_dat = datetime.fromisoformat(ngay_dat_str.replace('Z', '+00:00'))
                ngay_dat = ngay_dat.date()  # Convert to date object
            except (ValueError, AttributeError):
                # If parsing fails, use current date
                ngay_dat = date.today()
        elif isinstance(ngay_dat_str, date):
            ngay_dat = ngay_dat_str
        else:
            ngay_dat = date.today()
    else:
        ngay_dat = date.today()
    
    # ORDER FLOW STEP 4.1.5: Calculate shipping fee
    # Get shipping fee from request (if provided)
    phi_ship = donhang.get("PhiShip")
    if phi_ship is None:
        # Calculate shipping based on subtotal if not provided
        # Free shipping if order >= 10,000,000 VND
        phi_ship = 0 if original_amount >= 10000000 else 100000
    
    # ORDER FLOW STEP 4.1.6: Create DonHang record
    # Store discount percentage as string in KhuyenMai field for backward compatibility
    discount_info = f"{applied_discount}%" if applied_discount else None
    
    new_dh = DonHang(
        NgayDat=ngay_dat,
        TongTien=final_amount,  # Final amount after discount applied
        TrangThai=donhang.get("TrangThai"),  # Initial status (usually "Chờ thanh toán")
        MaKH=donhang.get("MaKH"),  # Customer ID
        MaNV=donhang.get("MaNV"),  # Employee ID (if order created by employee)
        KhuyenMai=discount_info,  # Store discount percentage as "X%"
        PhiShip=phi_ship  # Store shipping fee
    )
    db.add(new_dh)
    db.commit()
    db.refresh(new_dh)

    # ORDER FLOW STEP 4.1.7: Create order items (DonHang_SanPham records)
    # Each item stores price snapshot (DonGia) at order time
    # This preserves historical pricing even if product price changes later
    items = donhang.get("items", [])
    if items:
        from backend.models import DonHang_SanPham
        for item in items:
            # Validate required fields
            ma_sp = item.get("MaSP")
            if not ma_sp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"MaSP is required for order item. Received item: {item}"
                )
            
            # Create order item record with price snapshot
            order_item = DonHang_SanPham(
                MaDonHang=new_dh.MaDonHang,
                MaSP=ma_sp,
                SoLuong=item.get("SoLuong", 1),
                DonGia=item.get("DonGia", 0),  # Price snapshot at order time (critical for historical accuracy)
                GiamGia=item.get("GiamGia", 0)  # Item-level discount
            )
            db.add(order_item)
        db.commit()

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
    
    # Return order info with discount details
    response = {
        "MaDonHang": new_dh.MaDonHang,
        "TongTien": float(new_dh.TongTien),
        "KhuyenMai": new_dh.KhuyenMai
    }
    
    # Add discount information if discount was applied
    if applied_discount is not None:
        discount_amount = original_amount - final_amount
        response.update({
            "original_amount": original_amount,
            "discount_amount": discount_amount,
            "discount_percentage": applied_discount,
            "voucher_applied": False  # Keep for backward compatibility
        })
    else:
        response["voucher_applied"] = False
    
    return response

# Read all


@router.get("/", response_model=list)
def get_all_donhang(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Lấy danh sách tất cả đơn hàng.
    Admin, Manager, Employee xem tất cả. Customer chỉ xem đơn hàng của mình.
    """
    try:
        from backend.models import DonHang_SanPham, SanPham
        
        user_role = current_user.get("role")
        user_id = current_user.get("user_id")
        
        # Filter by customer if they're a customer
        if user_role in ["KhachHang", "Customer"]:
            dhs = db.query(DonHang).filter(DonHang.MaKH == user_id).all()
        else:
            dhs = db.query(DonHang).all()
        
        # Properly serialize SQLAlchemy objects to dictionaries with items
        result = []
        for dh in dhs:
            # Get order items
            order_items = db.query(DonHang_SanPham, SanPham).join(
                SanPham, DonHang_SanPham.MaSP == SanPham.MaSP
            ).filter(
                DonHang_SanPham.MaDonHang == dh.MaDonHang
            ).all()
            
            # Format order items
            items = []
            for order_item, product in order_items:
                items.append({
                    "MaSP": order_item.MaSP,
                    "TenSP": product.TenSP if product else f"Sản phẩm #{order_item.MaSP}",
                    "SoLuong": order_item.SoLuong,
                    "DonGia": float(order_item.DonGia) if order_item.DonGia else 0.0,
                    "GiamGia": float(order_item.GiamGia) if order_item.GiamGia else 0.0,
                })
            
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
                "items": items,  # Include order items
            }
            result.append(order_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách đơn hàng: {str(e)}"
        )

# Get customer's own orders
@router.get("/my-orders", response_model=list)
def get_my_orders(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Lấy danh sách đơn hàng của khách hàng hiện tại.
    """
    try:
        # Get customer ID from current user
        user_role = current_user.get("role")
        if user_role != "KhachHang":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Endpoint này chỉ dành cho khách hàng"
            )
        
        customer_id = current_user.get("user_id")
        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy thông tin khách hàng"
            )
        
        # Get orders for this customer
        dhs = db.query(DonHang).filter(DonHang.MaKH == customer_id).order_by(DonHang.NgayDat.desc()).all()
        
        # Serialize to dictionaries
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy lịch sử đơn hàng: {str(e)}"
        )

# Read one


@router.get("/{madonhang}", response_model=dict)
def get_donhang(madonhang: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Lấy thông tin chi tiết một đơn hàng bao gồm danh sách sản phẩm.
    """
    try:
        from backend.models import DonHang_SanPham, SanPham
        
        dh = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
        if not dh:
            raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
        
        # Check permission: customers can only view their own orders
        user_role = current_user.get("role")
        user_id = current_user.get("user_id")
        if user_role in ["KhachHang", "Customer"]:
            if dh.MaKH != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn không có quyền xem đơn hàng này"
                )
        
        # Get order items with product details
        order_items = db.query(DonHang_SanPham, SanPham).join(
            SanPham, DonHang_SanPham.MaSP == SanPham.MaSP
        ).filter(
            DonHang_SanPham.MaDonHang == madonhang
        ).all()
        
        # Format order items
        items = []
        for order_item, product in order_items:
            items.append({
                "MaSP": order_item.MaSP,
                "TenSP": product.TenSP if product else f"Sản phẩm #{order_item.MaSP}",
                "SoLuong": order_item.SoLuong,
                "DonGia": float(order_item.DonGia) if order_item.DonGia else 0.0,  # Price at order time (snapshot)
                "GiamGia": float(order_item.GiamGia) if order_item.GiamGia else 0.0,
                "image": product.HinhAnh if product else None
            })
        
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
            "items": items  # Include order items
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
    from backend.routes.deps import has_role
    if not has_role(current_user, ["Admin", "Manager", "Employee", "NhanVien"]):
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

# ORDER FLOW STEP 4.2: Update order status
# Called by admin/employee to change order status
# This is critical: status changes trigger inventory operations
# Calls InventoryManager to handle stock reserve/release/confirm/cancel
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
    
    Status transitions trigger inventory operations:
    - Pending/Confirmed → Processing: Reserve stock
    - Processing → Shipped: Confirm stock deduction
    - Any → Cancelled: Release stock back
    """
    # ORDER FLOW STEP 4.2.1: Validate permissions
    # Only Admin, Manager, and Employee can update order status
    from backend.routes.deps import has_role
    if not has_role(current_user, ["Admin", "Manager", "Employee", "NhanVien"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        # ORDER FLOW STEP 4.2.2: Get order from database
        order = db.query(DonHang).filter(DonHang.MaDonHang == madonhang).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Đơn hàng không tồn tại"
            )
        
        old_status = order.TrangThai
        new_status = request.new_status
        
        # ORDER FLOW STEP 4.2.3: Validate status transition
        # Only allow valid status values
        valid_statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {', '.join(valid_statuses)}"
            )
        
        # ORDER FLOW STEP 4.2.4: Handle inventory changes
        # This is critical: status changes affect inventory
        # InventoryManager determines what action to take based on status transition:
        # - Reserve stock when order is confirmed
        # - Deduct stock when order is processing/shipped
        # - Release stock when order is cancelled
        inventory_success, inventory_message = InventoryManager.handle_inventory_change(
            db, madonhang, new_status, old_status
        )
        
        if not inventory_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lỗi cập nhật tồn kho: {inventory_message}"
            )
        
        # ORDER FLOW STEP 4.2.5: Update order status in database
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
    from backend.routes.deps import has_role
    if not has_role(current_user, ["Admin", "Manager", "Employee", "NhanVien"]):
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
    from backend.routes.deps import has_role
    if not has_role(current_user, ["Admin", "Manager", "Employee", "NhanVien"]):
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
