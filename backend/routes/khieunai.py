# backend/routes/khieunai.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from backend.database import get_db
from backend.models import KhieuNai, KhachHang, NhanVien
from backend.routes.deps import get_current_user
from backend.schemas import (
    ComplaintCreateRequest, 
    ComplaintResponse, 
    ComplaintUpdateRequest, 
    ComplaintListResponse
)
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/complaints", tags=["Complaints"])

# =====================================================
# 🧾 Routes
# =====================================================

@router.post("/", response_model=ComplaintResponse, summary="Tạo khiếu nại")
def create_complaint(
    complaint_data: ComplaintCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Tạo khiếu nại mới.
    Chỉ khách hàng mới có thể tạo khiếu nại.
    """
    # Role check: Only customers can create complaints
    if current_user.get("role") != "KhachHang":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ khách hàng mới có thể tạo khiếu nại"
        )
    
    try:
        # Get customer ID from JWT token
        customer_id = current_user.get("user_id")
        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy thông tin khách hàng"
            )
        
        # Validate input
        if not complaint_data.TieuDe.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tiêu đề không được để trống"
            )
        
        if not complaint_data.NoiDung.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nội dung không được để trống"
            )
        
        # Create new complaint
        new_complaint = KhieuNai(
            MaKH=customer_id,
            TieuDe=complaint_data.TieuDe.strip(),
            NoiDung=complaint_data.NoiDung.strip(),
            TrangThai="Pending",
            NgayTao=datetime.now(),
            NgayCapNhat=datetime.now(),
            IsDelete=False
        )
        
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)
        
        # Get customer name for response
        customer = db.query(KhachHang).filter(KhachHang.MaKH == customer_id).first()
        
        return ComplaintResponse(
            MaKhieuNai=new_complaint.MaKhieuNai,
            MaKH=new_complaint.MaKH,
            TieuDe=new_complaint.TieuDe,
            NoiDung=new_complaint.NoiDung,
            TrangThai=new_complaint.TrangThai,
            NgayTao=new_complaint.NgayTao,
            NgayCapNhat=new_complaint.NgayCapNhat,
            PhanHoi=new_complaint.PhanHoi,
            MaNVPhanHoi=new_complaint.MaNVPhanHoi,
            TenKH=customer.TenKH if customer else None,
            TenNVPhanHoi=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo khiếu nại: {str(e)}"
        )

@router.get("/my-complaints", response_model=List[ComplaintResponse], summary="Xem khiếu nại của tôi")
def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách khiếu nại của khách hàng hiện tại.
    """
    # Role check: Only customers can view their complaints
    if current_user.get("role") != "KhachHang":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ khách hàng mới có thể xem khiếu nại của mình"
        )
    
    try:
        customer_id = current_user.get("user_id")
        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy thông tin khách hàng"
            )
        
        # Get customer's complaints
        complaints = db.query(KhieuNai).filter(
            and_(
                KhieuNai.MaKH == customer_id,
                KhieuNai.IsDelete == False
            )
        ).order_by(KhieuNai.NgayTao.desc()).all()
        
        # Format response
        complaint_list = []
        for complaint in complaints:
            customer = db.query(KhachHang).filter(KhachHang.MaKH == complaint.MaKH).first()
            staff = None
            if complaint.MaNVPhanHoi:
                staff = db.query(NhanVien).filter(NhanVien.MaNV == complaint.MaNVPhanHoi).first()
            
            complaint_list.append(ComplaintResponse(
                MaKhieuNai=complaint.MaKhieuNai,
                MaKH=complaint.MaKH,
                TieuDe=complaint.TieuDe,
                NoiDung=complaint.NoiDung,
                TrangThai=complaint.TrangThai,
                NgayTao=complaint.NgayTao,
                NgayCapNhat=complaint.NgayCapNhat,
                PhanHoi=complaint.PhanHoi,
                MaNVPhanHoi=complaint.MaNVPhanHoi,
                TenKH=customer.TenKH if customer else None,
                TenNVPhanHoi=staff.TenNV if staff else None
            ))
        
        return complaint_list
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy khiếu nại: {str(e)}"
        )

@router.get("/", response_model=ComplaintListResponse, summary="Xem tất cả khiếu nại (Admin/Manager)")
def get_all_complaints(
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả khiếu nại.
    Chỉ Admin và Manager mới có thể xem.
    """
    # Role check: Only Admin and Manager can view all complaints
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin và Manager mới có thể xem tất cả khiếu nại"
        )
    
    try:
        # Build query
        query = db.query(KhieuNai).filter(KhieuNai.IsDelete == False)
        
        # Apply status filter if provided
        if status_filter:
            valid_statuses = ["Pending", "Processing", "Resolved", "Closed"]
            if status_filter not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {', '.join(valid_statuses)}"
                )
            query = query.filter(KhieuNai.TrangThai == status_filter)
        
        # Get total count
        total_complaints = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        complaints = query.order_by(KhieuNai.NgayTao.desc()).offset(offset).limit(limit).all()
        
        # Format response
        complaint_list = []
        for complaint in complaints:
            customer = db.query(KhachHang).filter(KhachHang.MaKH == complaint.MaKH).first()
            staff = None
            if complaint.MaNVPhanHoi:
                staff = db.query(NhanVien).filter(NhanVien.MaNV == complaint.MaNVPhanHoi).first()
            
            complaint_list.append(ComplaintResponse(
                MaKhieuNai=complaint.MaKhieuNai,
                MaKH=complaint.MaKH,
                TieuDe=complaint.TieuDe,
                NoiDung=complaint.NoiDung,
                TrangThai=complaint.TrangThai,
                NgayTao=complaint.NgayTao,
                NgayCapNhat=complaint.NgayCapNhat,
                PhanHoi=complaint.PhanHoi,
                MaNVPhanHoi=complaint.MaNVPhanHoi,
                TenKH=customer.TenKH if customer else None,
                TenNVPhanHoi=staff.TenNV if staff else None
            ))
        
        return ComplaintListResponse(
            complaints=complaint_list,
            total=total_complaints
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy khiếu nại: {str(e)}"
        )

@router.put("/{ma_khieunai}", response_model=ComplaintResponse, summary="Cập nhật khiếu nại")
def update_complaint(
    ma_khieunai: int,
    update_data: ComplaintUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật khiếu nại (trạng thái và phản hồi).
    Chỉ Admin và Manager mới có thể cập nhật.
    """
    # Role check: Only Admin and Manager can update complaints
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin và Manager mới có thể cập nhật khiếu nại"
        )
    
    try:
        # Get complaint
        complaint = db.query(KhieuNai).filter(
            and_(
                KhieuNai.MaKhieuNai == ma_khieunai,
                KhieuNai.IsDelete == False
            )
        ).first()
        
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khiếu nại không tồn tại"
            )
        
        # Get staff ID from JWT token
        staff_id = current_user.get("user_id")
        
        # Update fields
        if update_data.TrangThai is not None:
            valid_statuses = ["Pending", "Processing", "Resolved", "Closed"]
            if update_data.TrangThai not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {', '.join(valid_statuses)}"
                )
            complaint.TrangThai = update_data.TrangThai
        
        if update_data.PhanHoi is not None:
            complaint.PhanHoi = update_data.PhanHoi.strip()
            complaint.MaNVPhanHoi = staff_id
        
        complaint.NgayCapNhat = datetime.now()
        
        db.commit()
        db.refresh(complaint)
        
        # Get related data for response
        customer = db.query(KhachHang).filter(KhachHang.MaKH == complaint.MaKH).first()
        staff = None
        if complaint.MaNVPhanHoi:
            staff = db.query(NhanVien).filter(NhanVien.MaNV == complaint.MaNVPhanHoi).first()
        
        return ComplaintResponse(
            MaKhieuNai=complaint.MaKhieuNai,
            MaKH=complaint.MaKH,
            TieuDe=complaint.TieuDe,
            NoiDung=complaint.NoiDung,
            TrangThai=complaint.TrangThai,
            NgayTao=complaint.NgayTao,
            NgayCapNhat=complaint.NgayCapNhat,
            PhanHoi=complaint.PhanHoi,
            MaNVPhanHoi=complaint.MaNVPhanHoi,
            TenKH=customer.TenKH if customer else None,
            TenNVPhanHoi=staff.TenNV if staff else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật khiếu nại: {str(e)}"
        )

@router.get("/{ma_khieunai}", response_model=ComplaintResponse, summary="Xem chi tiết khiếu nại")
def get_complaint_detail(
    ma_khieunai: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Xem chi tiết khiếu nại.
    Khách hàng chỉ có thể xem khiếu nại của mình.
    Admin/Manager có thể xem tất cả.
    """
    try:
        # Get complaint
        complaint = db.query(KhieuNai).filter(
            and_(
                KhieuNai.MaKhieuNai == ma_khieunai,
                KhieuNai.IsDelete == False
            )
        ).first()
        
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khiếu nại không tồn tại"
            )
        
        # Check permissions
        user_role = current_user.get("role")
        customer_id = current_user.get("user_id")
        
        if user_role == "KhachHang" and complaint.MaKH != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn chỉ có thể xem khiếu nại của mình"
            )
        
        # Get related data
        customer = db.query(KhachHang).filter(KhachHang.MaKH == complaint.MaKH).first()
        staff = None
        if complaint.MaNVPhanHoi:
            staff = db.query(NhanVien).filter(NhanVien.MaNV == complaint.MaNVPhanHoi).first()
        
        return ComplaintResponse(
            MaKhieuNai=complaint.MaKhieuNai,
            MaKH=complaint.MaKH,
            TieuDe=complaint.TieuDe,
            NoiDung=complaint.NoiDung,
            TrangThai=complaint.TrangThai,
            NgayTao=complaint.NgayTao,
            NgayCapNhat=complaint.NgayCapNhat,
            PhanHoi=complaint.PhanHoi,
            MaNVPhanHoi=complaint.MaNVPhanHoi,
            TenKH=customer.TenKH if customer else None,
            TenNVPhanHoi=staff.TenNV if staff else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy chi tiết khiếu nại: {str(e)}"
        )

@router.delete("/{ma_khieunai}", response_model=dict, summary="Xóa khiếu nại")
def delete_complaint(
    ma_khieunai: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Xóa khiếu nại (soft delete).
    Chỉ Admin mới có thể xóa.
    """
    # Role check: Only Admin can delete complaints
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có thể xóa khiếu nại"
        )
    
    try:
        # Get complaint
        complaint = db.query(KhieuNai).filter(
            and_(
                KhieuNai.MaKhieuNai == ma_khieunai,
                KhieuNai.IsDelete == False
            )
        ).first()
        
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Khiếu nại không tồn tại"
            )
        
        # Soft delete
        complaint.IsDelete = True
        db.commit()
        
        return {"message": "Đã xóa khiếu nại thành công"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xóa khiếu nại: {str(e)}"
        )
