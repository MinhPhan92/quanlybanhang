from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models import DanhMuc
from backend.routes.deps import get_current_user, get_current_user_optional

router = APIRouter(tags=["DanhMuc"])

# Create


@router.post("/", response_model=dict)
def create_danhmuc(danhmuc: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Admin, Manager, and Employee can create categories
    user_role = current_user.get("role")
    if user_role not in ["Admin", "Manager", "Employee", "NhanVien"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    new_dm = DanhMuc(
        TenDanhMuc=danhmuc.get("TenDanhMuc"),
        IsDelete=danhmuc.get("IsDelete", 0)
    )
    db.add(new_dm)
    db.commit()
    db.refresh(new_dm)
    return {"MaDanhMuc": new_dm.MaDanhMuc}

# Read all


@router.get("/")
def get_all_danhmuc(
    db: Session = Depends(get_db), 
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Lấy danh sách danh mục.
    Public access - không yêu cầu đăng nhập.
    """
    try:
        dms = db.query(DanhMuc).filter(DanhMuc.IsDelete == 0).all()
        # Properly serialize SQLAlchemy objects to dictionaries
        result = []
        for dm in dms:
            result.append({
                "MaDanhMuc": dm.MaDanhMuc,
                "TenDanhMuc": dm.TenDanhMuc,
                "IsDelete": bool(dm.IsDelete) if dm.IsDelete is not None else False
            })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách danh mục: {str(e)}"
        )

# Read one


@router.get("/{madanhmuc}")
def get_danhmuc(madanhmuc: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    dm = db.query(DanhMuc).filter(DanhMuc.MaDanhMuc ==
                                  madanhmuc, DanhMuc.IsDelete == 0).first()
    if not dm:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại")
    return {
        "MaDanhMuc": dm.MaDanhMuc,
        "TenDanhMuc": dm.TenDanhMuc,
        "IsDelete": bool(dm.IsDelete) if dm.IsDelete is not None else False
    }

# Update


@router.put("/{madanhmuc}", response_model=dict)
def update_danhmuc(madanhmuc: int, danhmuc: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Admin, Manager, and Employee can update categories
    user_role = current_user.get("role")
    if user_role not in ["Admin", "Manager", "Employee", "NhanVien"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    dm = db.query(DanhMuc).filter(DanhMuc.MaDanhMuc ==
                                  madanhmuc, DanhMuc.IsDelete == 0).first()
    if not dm:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại")
    for key, value in danhmuc.items():
        if hasattr(dm, key):
            setattr(dm, key, value)
    db.commit()
    db.refresh(dm)
    return {
        "MaDanhMuc": dm.MaDanhMuc,
        "TenDanhMuc": dm.TenDanhMuc,
        "IsDelete": bool(dm.IsDelete) if dm.IsDelete is not None else False
    }

# Delete (soft delete)


@router.delete("/{madanhmuc}", response_model=dict)
def delete_danhmuc(madanhmuc: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Role check: Only Admin can delete categories
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    
    dm = db.query(DanhMuc).filter(DanhMuc.MaDanhMuc ==
                                  madanhmuc, DanhMuc.IsDelete == 0).first()
    if not dm:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại")
    dm.IsDelete = 1
    db.commit()
    return {"message": "Đã xóa danh mục"}
