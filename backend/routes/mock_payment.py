# =====================================================
# 📁 backend/routes/mock_payment.py
# =====================================================
# Mock QR Payment Gateway - Simulates VNPay/MoMo sandbox
# This is for TESTING purposes only, NOT for real payments.
#
# Flow:
# 1. User clicks "Thanh toán" → POST /api/payment/create-transaction
# 2. Backend creates transaction, returns paymentUrl with QR code
# 3. User scans QR or clicks link → /mock-pay/{transactionId}
# 4. Mock page shows payment options (Success/Fail/Cancel)
# 5. User clicks option → POST /api/payment/callback
# 6. Backend updates order status, redirects to result page
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import hashlib

from backend.database import get_db
from backend.models import DonHang, PaymentTransaction, ThanhToan
from backend.routes.deps import get_current_user, get_current_user_optional
from backend.schemas import (
    CreateTransactionRequest,
    CreateTransactionResponse,
    TransactionInfoResponse,
    PaymentCallbackRequest,
    PaymentCallbackResponse,
)

router = APIRouter(tags=["MockPayment"])

# =====================================================
# ⚙️ Configuration
# =====================================================
# Secret key for signature generation (in production, use env variable)
MOCK_PAYMENT_SECRET = "MOCK_PAY_SECRET_67PM3"

# Frontend base URL for payment page
FRONTEND_BASE_URL = "http://localhost:3000"


# =====================================================
# 🔐 Signature Utilities
# =====================================================

def generate_signature(transaction_id: str, amount: float) -> str:
    """
    Generate signature for transaction verification.
    Formula: SHA256(transactionId + amount + SECRET)
    """
    data = f"{transaction_id}{amount}{MOCK_PAYMENT_SECRET}"
    return hashlib.sha256(data.encode()).hexdigest()


def verify_signature(transaction_id: str, amount: float, signature: str) -> bool:
    """
    Verify that signature matches expected value.
    """
    expected = generate_signature(transaction_id, amount)
    return signature == expected


def generate_transaction_id() -> str:
    """
    Generate unique transaction ID in format: TXN_{timestamp}_{uuid}
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_part = str(uuid.uuid4())[:8].upper()
    return f"TXN_{timestamp}_{unique_part}"


# =====================================================
# 📋 API Endpoints
# =====================================================

# ORDER FLOW STEP 5.1: Create payment transaction
# Called from checkout page when user selects QR payment
# Creates PaymentTransaction record linked to order
@router.post("/create-transaction", response_model=CreateTransactionResponse, 
             summary="Tạo giao dịch thanh toán mới")
def create_transaction(
    request: CreateTransactionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    ORDER FLOW STEP 5.1.1: Create payment transaction for order
    
    This is called from checkout page when user selects QR payment method.
    - Validates order exists and is in PENDING_PAYMENT status
    - Creates PaymentTransaction with amount = order.TongTien (locked, cannot be modified)
    - Generates unique transaction ID and signature
    - Returns paymentUrl for QR code display
    
    **Lưu ý**: Amount được lấy từ đơn hàng, không cho phép user tự nhập.
    """
    # ORDER FLOW STEP 5.1.2: Find the order
    order = db.query(DonHang).filter(DonHang.MaDonHang == request.orderId).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đơn hàng #{request.orderId}"
        )
    
    # ORDER FLOW STEP 5.1.3: Validate order status
    # Only allow payment for pending orders
    # Allow various pending states for flexibility
    allowed_statuses = ["PENDING_PAYMENT", "Chờ thanh toán", "Chờ xử lý", "Pending", "pending", None]
    if order.TrangThai and order.TrangThai not in allowed_statuses:
        # Check if order is already paid
        if order.TrangThai in ["PAID", "Đã thanh toán", "Đã xử lý"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Đơn hàng #{request.orderId} đã được thanh toán"
            )
    
    # ORDER FLOW STEP 5.1.4: Check for existing transaction
    # Prevent duplicate transactions for same order
    existing_txn = db.query(PaymentTransaction).filter(
        PaymentTransaction.MaDonHang == request.orderId,
        PaymentTransaction.Status == "CREATED"
    ).first()
    
    if existing_txn:
        # Return existing transaction instead of creating new one
        return CreateTransactionResponse(
            transactionId=existing_txn.TransactionId,
            orderId=request.orderId,
            amount=float(existing_txn.Amount),
            paymentUrl=f"/mock-pay/{existing_txn.TransactionId}",
            status=existing_txn.Status
        )
    
    # ORDER FLOW STEP 5.1.5: Generate transaction ID and signature
    # Transaction ID format: TXN_timestamp_uuid
    # Signature: SHA256 hash for verification
    transaction_id = generate_transaction_id()
    amount = float(order.TongTien) if order.TongTien else 0.0  # Amount locked to order total
    signature = generate_signature(transaction_id, amount)
    
    # ORDER FLOW STEP 5.1.6: Create PaymentTransaction record
    # This record tracks the payment process
    transaction = PaymentTransaction(
        TransactionId=transaction_id,
        MaDonHang=request.orderId,
        Amount=amount,
        Status="CREATED",
        Signature=signature,
        CreatedAt=datetime.utcnow(),
        UpdatedAt=datetime.utcnow()
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    # ORDER FLOW STEP 5.1.7: Return transaction info with payment URL
    # Payment URL is used to generate QR code and navigate to mock payment page
    return CreateTransactionResponse(
        transactionId=transaction_id,
        orderId=request.orderId,
        amount=amount,
        paymentUrl=f"/mock-pay/{transaction_id}",
        status="CREATED"
    )


@router.get("/transaction/{transaction_id}", response_model=TransactionInfoResponse,
            summary="Lấy thông tin giao dịch")
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết giao dịch.
    
    Endpoint này không yêu cầu authentication để mock payment page có thể
    fetch thông tin giao dịch (giống như VNPay/MoMo redirect page).
    """
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.TransactionId == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy giao dịch {transaction_id}"
        )
    
    return TransactionInfoResponse(
        transactionId=transaction.TransactionId,
        orderId=transaction.MaDonHang,
        amount=float(transaction.Amount),
        status=transaction.Status,
        createdAt=transaction.CreatedAt,
        signature=transaction.Signature
    )


# ORDER FLOW STEP 5.2: Payment callback handler
# Called from mock payment page when user clicks Success/Failed/Cancel
# Updates transaction status and order status based on payment result
@router.post("/callback", response_model=PaymentCallbackResponse,
             summary="Xử lý kết quả thanh toán")
def payment_callback(
    request: PaymentCallbackRequest,
    db: Session = Depends(get_db)
):
    """
    ORDER FLOW STEP 5.2.1: Process payment callback from mock payment page
    
    This simulates a real payment gateway callback (like VNPay/MoMo).
    - Verifies signature for security
    - Updates transaction status (SUCCESS/FAILED/CANCELED)
    - Updates order status based on result
    - If SUCCESS: Creates ThanhToan record and updates order to "Chờ xử lý"
    - Returns redirect URL for frontend
    
    **Results**: SUCCESS, FAILED, CANCELED
    """
    # 1. Find the transaction
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.TransactionId == request.transactionId
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy giao dịch {request.transactionId}"
        )
    
    # 2. Check if transaction is already processed
    if transaction.Status != "CREATED":
        return PaymentCallbackResponse(
            success=False,
            message=f"Giao dịch đã được xử lý trước đó (status: {transaction.Status})",
            transactionId=request.transactionId,
            orderId=transaction.MaDonHang,
            orderStatus=transaction.donhang.TrangThai if transaction.donhang else "UNKNOWN",
            redirectUrl=f"/payment/failed?error=Giao+dịch+đã+được+xử+lý"
        )
    
    # 3. Verify signature
    if not verify_signature(request.transactionId, float(transaction.Amount), request.signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature không hợp lệ"
        )
    
    # 4. Get the order
    order = db.query(DonHang).filter(DonHang.MaDonHang == transaction.MaDonHang).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đơn hàng #{transaction.MaDonHang}"
        )
    
    # 5. Process based on result
    result = request.result.upper()
    now = datetime.utcnow()
    
    # ORDER FLOW STEP 5.2.2: Handle SUCCESS result
    if result == "SUCCESS":
        # Update transaction status to SUCCESS
        transaction.Status = "SUCCESS"
        transaction.UpdatedAt = now
        
        # ORDER FLOW STEP 5.2.3: Update order status
        # Change from "Chờ thanh toán" to "Chờ xử lý"
        # This indicates payment is complete and order is ready for processing
        order.TrangThai = "Chờ xử lý"
        
        # ORDER FLOW STEP 5.2.4: Create payment record
        # Record payment in ThanhToan table for payment history
        payment = ThanhToan(
            MaDonHang=order.MaDonHang,
            PhuongThuc="QR_PAYMENT",  # Mock QR payment method
            NgayThanhToan=now.date(),
            SoTien=transaction.Amount
        )
        db.add(payment)
        
        db.commit()
        
        # Return success response with redirect URL
        return PaymentCallbackResponse(
            success=True,
            message="Thanh toán thành công!",
            transactionId=request.transactionId,
            orderId=order.MaDonHang,
            orderStatus="Chờ xử lý",
            redirectUrl=f"/payment/success?transactionId={request.transactionId}&orderId={order.MaDonHang}&amount={float(transaction.Amount)}"
        )
    
    elif result == "FAILED":
        transaction.Status = "FAILED"
        transaction.UpdatedAt = now
        # Order remains in pending payment status
        db.commit()
        
        return PaymentCallbackResponse(
            success=False,
            message="Thanh toán thất bại",
            transactionId=request.transactionId,
            orderId=order.MaDonHang,
            orderStatus=order.TrangThai or "PENDING_PAYMENT",
            redirectUrl=f"/payment/failed?error=Thanh+toán+thất+bại&orderId={order.MaDonHang}"
        )
    
    elif result == "CANCELED":
        transaction.Status = "CANCELED"
        transaction.UpdatedAt = now
        # Order remains in pending payment status
        db.commit()
        
        return PaymentCallbackResponse(
            success=False,
            message="Giao dịch đã bị hủy",
            transactionId=request.transactionId,
            orderId=order.MaDonHang,
            orderStatus=order.TrangThai or "PENDING_PAYMENT",
            redirectUrl=f"/payment/failed?error=Giao+dịch+đã+bị+hủy&orderId={order.MaDonHang}"
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kết quả không hợp lệ: {result}. Chỉ chấp nhận: SUCCESS, FAILED, CANCELED"
        )


@router.get("/order/{order_id}/transactions", 
            summary="Lấy danh sách giao dịch của đơn hàng")
def get_order_transactions(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy tất cả giao dịch thanh toán của một đơn hàng.
    """
    transactions = db.query(PaymentTransaction).filter(
        PaymentTransaction.MaDonHang == order_id
    ).order_by(PaymentTransaction.CreatedAt.desc()).all()
    
    return [
        {
            "transactionId": t.TransactionId,
            "orderId": t.MaDonHang,
            "amount": float(t.Amount),
            "status": t.Status,
            "createdAt": t.CreatedAt.isoformat() if t.CreatedAt else None,
            "updatedAt": t.UpdatedAt.isoformat() if t.UpdatedAt else None
        }
        for t in transactions
    ]
