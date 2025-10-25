# backend/routes/inventory.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routes.deps import get_current_user
from backend.utils.inventory_manager import InventoryManager
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/inventory", tags=["Inventory"])

# =====================================================
# 📋 Request/Response Models
# =====================================================

class StockUpdateRequest(BaseModel):
    product_id: int
    quantity_change: int
    operation: str  # "add" or "subtract"

class StockUpdateResponse(BaseModel):
    success: bool
    message: str
    product_id: int
    new_quantity: Optional[int] = None

class LowStockResponse(BaseModel):
    products: List[dict]
    total: int
    threshold: int

# =====================================================
# 🧾 Routes
# =====================================================

@router.get("/low-stock", response_model=LowStockResponse, summary="Lấy danh sách sản phẩm sắp hết hàng")
def get_low_stock_products(
    threshold: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách sản phẩm có tồn kho thấp.
    Chỉ Admin và Manager mới có thể xem thông tin này.
    """
    # Role check: Only Admin and Manager can view low stock
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        low_stock_products = InventoryManager.get_low_stock_products(db, threshold)
        
        return LowStockResponse(
            products=low_stock_products,
            total=len(low_stock_products),
            threshold=threshold
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách sản phẩm sắp hết hàng: {str(e)}"
        )

@router.put("/update-stock", response_model=StockUpdateResponse, summary="Cập nhật tồn kho sản phẩm")
def update_product_stock(
    request: StockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật tồn kho sản phẩm (thêm hoặc trừ).
    Chỉ Admin và Manager mới có thể cập nhật tồn kho.
    """
    # Role check: Only Admin and Manager can update stock
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        # Validate operation
        if request.operation not in ["add", "subtract"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation phải là 'add' hoặc 'subtract'"
            )
        
        # Update stock
        success, message = InventoryManager.update_product_stock(
            db, request.product_id, request.quantity_change, request.operation
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Get updated product info
        from backend.models import SanPham
        product = db.query(SanPham).filter(SanPham.MaSP == request.product_id).first()
        
        return StockUpdateResponse(
            success=True,
            message=message,
            product_id=request.product_id,
            new_quantity=product.SoLuongTonKho if product else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật tồn kho: {str(e)}"
        )

@router.get("/check-availability", response_model=dict, summary="Kiểm tra tồn kho cho danh sách sản phẩm")
def check_stock_availability(
    product_ids: str,  # Comma-separated product IDs
    quantities: str,   # Comma-separated quantities
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Kiểm tra tồn kho cho một danh sách sản phẩm.
    Format: product_ids="1,2,3" quantities="5,10,2"
    """
    # Role check: Only Admin, Manager, and Employee can check stock
    if current_user.get("role") not in ["Admin", "Manager", "Employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        # Parse input
        product_id_list = [int(x.strip()) for x in product_ids.split(",")]
        quantity_list = [int(x.strip()) for x in quantities.split(",")]
        
        if len(product_id_list) != len(quantity_list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số lượng product_ids và quantities phải bằng nhau"
            )
        
        # Prepare items data
        items_data = [
            {"MaSP": pid, "SoLuong": qty}
            for pid, qty in zip(product_id_list, quantity_list)
        ]
        
        # Check availability
        is_available, message, insufficient_items = InventoryManager.check_stock_availability(
            db, items_data
        )
        
        return {
            "available": is_available,
            "message": message,
            "insufficient_items": insufficient_items,
            "checked_items": items_data
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng dữ liệu không hợp lệ. Sử dụng số nguyên cách nhau bởi dấu phẩy"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi kiểm tra tồn kho: {str(e)}"
        )
