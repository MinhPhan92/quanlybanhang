# backend/routes/contact.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import LienHe
from backend.routes.deps import get_current_user_optional, get_current_user
from backend.schemas import (
    ContactCreateRequest,
    ContactResponse,
    ContactListResponse
)
from datetime import datetime
from typing import List, Optional

router = APIRouter(tags=["Contact"])

# =====================================================
# 🧾 Routes
# =====================================================

@router.post("/", response_model=ContactResponse, summary="Gửi form liên hệ (Public)")
def create_contact(
    contact_data: ContactCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Gửi form liên hệ - Public access, không yêu cầu đăng nhập.
    Bất kỳ ai cũng có thể gửi form liên hệ.
    """
    try:
        new_contact = LienHe(
            HoTen=contact_data.HoTen,
            Email=contact_data.Email,
            SoDienThoai=contact_data.SoDienThoai,
            ChuDe=contact_data.ChuDe,
            NoiDung=contact_data.NoiDung,
            TrangThai="ChuaXuLy",
            NgayGui=datetime.utcnow(),
            IsDelete=False
        )
        
        db.add(new_contact)
        db.commit()
        db.refresh(new_contact)
        
        return ContactResponse(
            MaLienHe=new_contact.MaLienHe,
            HoTen=new_contact.HoTen,
            Email=new_contact.Email,
            SoDienThoai=new_contact.SoDienThoai,
            ChuDe=new_contact.ChuDe,
            NoiDung=new_contact.NoiDung,
            TrangThai=new_contact.TrangThai,
            NgayGui=new_contact.NgayGui,
            GhiChu=new_contact.GhiChu
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi gửi form liên hệ: {str(e)}"
        )


@router.get("/", response_model=ContactListResponse, summary="Lấy danh sách liên hệ (Admin/Manager)")
def get_all_contacts(
    page: int = 1,
    limit: int = 20,
    trang_thai: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách form liên hệ - Chỉ Admin và Manager mới có quyền xem.
    """
    # Role check: Only Admin and Manager can view contacts
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        query = db.query(LienHe).filter(LienHe.IsDelete == False)
        
        # Filter by status if provided
        if trang_thai:
            query = query.filter(LienHe.TrangThai == trang_thai)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        contacts = query.order_by(LienHe.NgayGui.desc()).offset(offset).limit(limit).all()
        
        contact_list = []
        for contact in contacts:
            contact_list.append(ContactResponse(
                MaLienHe=contact.MaLienHe,
                HoTen=contact.HoTen,
                Email=contact.Email,
                SoDienThoai=contact.SoDienThoai,
                ChuDe=contact.ChuDe,
                NoiDung=contact.NoiDung,
                TrangThai=contact.TrangThai,
                NgayGui=contact.NgayGui,
                GhiChu=contact.GhiChu
            ))
        
        return ContactListResponse(contacts=contact_list, total=total)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách liên hệ: {str(e)}"
        )

