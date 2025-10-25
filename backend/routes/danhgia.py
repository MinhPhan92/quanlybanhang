# backend/routes/danhgia.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from backend.database import get_db
from backend.models import DanhGia, SanPham, KhachHang, DonHang, DonHang_SanPham
from backend.routes.deps import get_current_user
from backend.schemas import ReviewCreateRequest, ReviewResponse, ReviewListResponse
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# =====================================================
# 🧾 Routes
# =====================================================

@router.post("/", response_model=ReviewResponse, summary="Tạo đánh giá sản phẩm")
def create_review(
    review_data: ReviewCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Tạo đánh giá mới cho sản phẩm.
    Chỉ khách hàng đã mua sản phẩm mới có thể đánh giá.
    """
    # Role check: Only customers can create reviews
    if current_user.get("role") != "KhachHang":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ khách hàng mới có thể tạo đánh giá"
        )
    
    try:
        # Get customer ID from JWT token
        customer_id = current_user.get("user_id")
        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy thông tin khách hàng"
            )
        
        # Validate rating
        if not (1 <= review_data.DiemDanhGia <= 5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Điểm đánh giá phải từ 1 đến 5"
            )
        
        # Check if product exists
        product = db.query(SanPham).filter(
            SanPham.MaSP == review_data.MaSP,
            SanPham.IsDelete == False
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sản phẩm không tồn tại"
            )
        
        # Check if customer has purchased this product
        has_purchased = db.query(DonHang_SanPham).join(DonHang).filter(
            and_(
                DonHang_SanPham.MaSP == review_data.MaSP,
                DonHang.MaKH == customer_id,
                DonHang.TrangThai.in_(["Delivered", "Confirmed", "Processing", "Shipped"])
            )
        ).first()
        
        if not has_purchased:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn chỉ có thể đánh giá sản phẩm đã mua"
            )
        
        # Check if customer has already reviewed this product
        existing_review = db.query(DanhGia).filter(
            and_(
                DanhGia.MaSP == review_data.MaSP,
                DanhGia.MaKH == customer_id,
                DanhGia.IsDelete == False
            )
        ).first()
        
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn đã đánh giá sản phẩm này rồi"
            )
        
        # Create new review
        new_review = DanhGia(
            MaSP=review_data.MaSP,
            MaKH=customer_id,
            DiemDanhGia=review_data.DiemDanhGia,
            NoiDung=review_data.NoiDung,
            NgayDanhGia=datetime.now(),
            IsDelete=False
        )
        
        db.add(new_review)
        db.commit()
        db.refresh(new_review)
        
        # Get customer and product names for response
        customer = db.query(KhachHang).filter(KhachHang.MaKH == customer_id).first()
        
        return ReviewResponse(
            MaDanhGia=new_review.MaDanhGia,
            MaSP=new_review.MaSP,
            MaKH=new_review.MaKH,
            DiemDanhGia=new_review.DiemDanhGia,
            NoiDung=new_review.NoiDung,
            NgayDanhGia=new_review.NgayDanhGia,
            TenKH=customer.TenKH if customer else None,
            TenSP=product.TenSP
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo đánh giá: {str(e)}"
        )

@router.get("/products/{ma_sp}", response_model=ReviewListResponse, summary="Xem đánh giá theo sản phẩm")
def get_product_reviews(
    ma_sp: int,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách đánh giá của một sản phẩm.
    """
    try:
        # Check if product exists
        product = db.query(SanPham).filter(
            SanPham.MaSP == ma_sp,
            SanPham.IsDelete == False
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sản phẩm không tồn tại"
            )
        
        # Get reviews with pagination
        offset = (page - 1) * limit
        
        reviews_query = db.query(DanhGia).join(KhachHang).filter(
            and_(
                DanhGia.MaSP == ma_sp,
                DanhGia.IsDelete == False
            )
        ).order_by(DanhGia.NgayDanhGia.desc())
        
        total_reviews = reviews_query.count()
        reviews = reviews_query.offset(offset).limit(limit).all()
        
        # Calculate average rating
        avg_rating = db.query(func.avg(DanhGia.DiemDanhGia)).filter(
            and_(
                DanhGia.MaSP == ma_sp,
                DanhGia.IsDelete == False
            )
        ).scalar()
        
        # Format response
        review_list = []
        for review in reviews:
            customer = db.query(KhachHang).filter(KhachHang.MaKH == review.MaKH).first()
            review_list.append(ReviewResponse(
                MaDanhGia=review.MaDanhGia,
                MaSP=review.MaSP,
                MaKH=review.MaKH,
                DiemDanhGia=review.DiemDanhGia,
                NoiDung=review.NoiDung,
                NgayDanhGia=review.NgayDanhGia,
                TenKH=customer.TenKH if customer else None,
                TenSP=product.TenSP
            ))
        
        return ReviewListResponse(
            reviews=review_list,
            total=total_reviews,
            average_rating=float(avg_rating) if avg_rating else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy đánh giá: {str(e)}"
        )

@router.get("/my-reviews", response_model=List[ReviewResponse], summary="Xem đánh giá của tôi")
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách đánh giá của khách hàng hiện tại.
    """
    # Role check: Only customers can view their reviews
    if current_user.get("role") != "KhachHang":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ khách hàng mới có thể xem đánh giá của mình"
        )
    
    try:
        customer_id = current_user.get("user_id")
        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy thông tin khách hàng"
            )
        
        # Get customer's reviews
        reviews = db.query(DanhGia).filter(
            and_(
                DanhGia.MaKH == customer_id,
                DanhGia.IsDelete == False
            )
        ).order_by(DanhGia.NgayDanhGia.desc()).all()
        
        # Format response
        review_list = []
        for review in reviews:
            product = db.query(SanPham).filter(SanPham.MaSP == review.MaSP).first()
            customer = db.query(KhachHang).filter(KhachHang.MaKH == review.MaKH).first()
            
            review_list.append(ReviewResponse(
                MaDanhGia=review.MaDanhGia,
                MaSP=review.MaSP,
                MaKH=review.MaKH,
                DiemDanhGia=review.DiemDanhGia,
                NoiDung=review.NoiDung,
                NgayDanhGia=review.NgayDanhGia,
                TenKH=customer.TenKH if customer else None,
                TenSP=product.TenSP if product else None
            ))
        
        return review_list
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy đánh giá: {str(e)}"
        )

@router.delete("/{ma_danhgia}", response_model=dict, summary="Xóa đánh giá")
def delete_review(
    ma_danhgia: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Xóa đánh giá (soft delete).
    Chỉ người tạo đánh giá hoặc Admin mới có thể xóa.
    """
    try:
        # Get review
        review = db.query(DanhGia).filter(
            and_(
                DanhGia.MaDanhGia == ma_danhgia,
                DanhGia.IsDelete == False
            )
        ).first()
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Đánh giá không tồn tại"
            )
        
        # Check permissions
        customer_id = current_user.get("user_id")
        user_role = current_user.get("role")
        
        if user_role != "Admin" and review.MaKH != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền xóa đánh giá này"
            )
        
        # Soft delete
        review.IsDelete = True
        db.commit()
        
        return {"message": "Đã xóa đánh giá thành công"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xóa đánh giá: {str(e)}"
        )
