# backend/routes/promotion.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routes.deps import get_current_user
from backend.utils.promotion_data import VoucherData
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/promotions", tags=["Promotions"])

# =====================================================
# 📋 Request/Response Models
# =====================================================

class ApplyVoucherRequest(BaseModel):
    voucher_code: str
    order_amount: float

class ApplyVoucherResponse(BaseModel):
    success: bool
    message: str
    voucher_code: Optional[str] = None
    discount_amount: Optional[float] = None
    final_amount: Optional[float] = None
    voucher_info: Optional[dict] = None

class VoucherListResponse(BaseModel):
    vouchers: list
    total: int

# =====================================================
# 🧾 Routes
# =====================================================

@router.post("/apply", response_model=ApplyVoucherResponse, summary="Áp dụng mã giảm giá")
def apply_voucher(
    request: ApplyVoucherRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Kiểm tra và tính toán mã giảm giá trước khi tạo đơn hàng chính thức.
    
    Args:
        request: Chứa voucher_code và order_amount
        db: Database session
        current_user: Thông tin người dùng hiện tại
        
    Returns:
        Thông tin về mã giảm giá và số tiền được giảm
    """
    try:
        # Lấy thông tin voucher
        voucher = VoucherData.get_voucher(request.voucher_code)
        if not voucher:
            return ApplyVoucherResponse(
                success=False,
                message="Mã giảm giá không tồn tại",
                voucher_code=request.voucher_code
            )
        
        # Kiểm tra tính hợp lệ của voucher
        is_valid, error_msg = VoucherData.is_voucher_valid(request.voucher_code, request.order_amount)
        if not is_valid:
            return ApplyVoucherResponse(
                success=False,
                message=error_msg,
                voucher_code=request.voucher_code
            )
        
        # Tính toán số tiền giảm giá
        discount_amount, calc_error = VoucherData.calculate_discount(request.voucher_code, request.order_amount)
        if calc_error:
            return ApplyVoucherResponse(
                success=False,
                message=calc_error,
                voucher_code=request.voucher_code
            )
        
        # Tính số tiền cuối cùng
        final_amount = request.order_amount - discount_amount
        
        # Chuẩn bị thông tin voucher để trả về
        voucher_info = {
            "code": voucher["code"],
            "name": voucher["name"],
            "type": voucher["type"],
            "discount_value": voucher["discount_value"],
            "min_order_amount": voucher["min_order_amount"],
            "max_discount": voucher["max_discount"]
        }
        
        return ApplyVoucherResponse(
            success=True,
            message="Mã giảm giá hợp lệ",
            voucher_code=request.voucher_code,
            discount_amount=discount_amount,
            final_amount=final_amount,
            voucher_info=voucher_info
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xử lý mã giảm giá: {str(e)}"
        )

@router.get("/list", response_model=VoucherListResponse, summary="Lấy danh sách mã giảm giá")
def get_voucher_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả mã giảm giá đang hoạt động.
    Chỉ Admin và Manager mới có thể xem danh sách này.
    """
    # Role check: Only Admin and Manager can view voucher list
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        vouchers = VoucherData.get_all_vouchers()
        
        # Format voucher data for response
        formatted_vouchers = []
        for voucher in vouchers:
            formatted_vouchers.append({
                "code": voucher["code"],
                "name": voucher["name"],
                "type": voucher["type"],
                "discount_value": voucher["discount_value"],
                "min_order_amount": voucher["min_order_amount"],
                "max_discount": voucher["max_discount"],
                "valid_from": voucher["valid_from"].isoformat(),
                "valid_to": voucher["valid_to"].isoformat(),
                "usage_limit": voucher["usage_limit"],
                "used_count": voucher["used_count"],
                "remaining_uses": voucher["usage_limit"] - voucher["used_count"],
                "is_active": voucher["is_active"]
            })
        
        return VoucherListResponse(
            vouchers=formatted_vouchers,
            total=len(formatted_vouchers)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy danh sách mã giảm giá: {str(e)}"
        )

@router.get("/check/{voucher_code}", response_model=dict, summary="Kiểm tra mã giảm giá")
def check_voucher(
    voucher_code: str,
    order_amount: float = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Kiểm tra tính hợp lệ của mã giảm giá mà không áp dụng.
    """
    try:
        voucher = VoucherData.get_voucher(voucher_code)
        if not voucher:
            return {
                "exists": False,
                "message": "Mã giảm giá không tồn tại"
            }
        
        is_valid, error_msg = VoucherData.is_voucher_valid(voucher_code, order_amount)
        
        if is_valid:
            discount_amount, _ = VoucherData.calculate_discount(voucher_code, order_amount)
            return {
                "exists": True,
                "valid": True,
                "message": "Mã giảm giá hợp lệ",
                "voucher_info": {
                    "code": voucher["code"],
                    "name": voucher["name"],
                    "type": voucher["type"],
                    "discount_value": voucher["discount_value"],
                    "min_order_amount": voucher["min_order_amount"],
                    "max_discount": voucher["max_discount"]
                },
                "discount_amount": discount_amount,
                "final_amount": order_amount - discount_amount
            }
        else:
            return {
                "exists": True,
                "valid": False,
                "message": error_msg,
                "voucher_info": {
                    "code": voucher["code"],
                    "name": voucher["name"],
                    "type": voucher["type"],
                    "discount_value": voucher["discount_value"],
                    "min_order_amount": voucher["min_order_amount"],
                    "max_discount": voucher["max_discount"]
                }
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi kiểm tra mã giảm giá: {str(e)}"
        )
