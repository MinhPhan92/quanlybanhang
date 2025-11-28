from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Project, NhanVien
from backend.routes.deps import get_current_user
from backend.utils.activity_logger import log_activity
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/project", tags=["Project"])

# =====================================================
# 📋 Request/Response Models
# =====================================================

class ProjectCreateRequest(BaseModel):
    TenProject: str
    MoTa: Optional[str] = None
    TrangThai: Optional[str] = "Active"

class ProjectUpdateRequest(BaseModel):
    TenProject: Optional[str] = None
    MoTa: Optional[str] = None
    TrangThai: Optional[str] = None

class ProjectResponse(BaseModel):
    MaProject: int
    TenProject: str
    MoTa: Optional[str]
    TrangThai: str
    NgayTao: datetime
    NgayCapNhat: datetime
    MaNVCreate: Optional[int]
    TenNVCreate: Optional[str] = None

# =====================================================
# 🔐 Create Project (Admin Only)
# =====================================================

@router.post("/", response_model=ProjectResponse, summary="Tạo dự án mới")
def create_project(
    project_data: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Tạo dự án mới. Chỉ Admin mới có quyền tạo dự án.
    """
    # Role check: Only Admin can create projects
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền tạo dự án"
        )
    
    try:
        # Get employee ID from current user
        ma_nv = current_user.get("MaNV")
        if not ma_nv:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không tìm thấy thông tin nhân viên"
            )
        
        # Validate status
        valid_statuses = ["Active", "Inactive", "Completed"]
        if project_data.TrangThai and project_data.TrangThai not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {', '.join(valid_statuses)}"
            )
        
        # Create new project
        new_project = Project(
            TenProject=project_data.TenProject,
            MoTa=project_data.MoTa,
            TrangThai=project_data.TrangThai or "Active",
            MaNVCreate=ma_nv,
            NgayTao=datetime.utcnow(),
            NgayCapNhat=datetime.utcnow()
        )
        
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        # Get creator name
        creator = db.query(NhanVien).filter(NhanVien.MaNV == ma_nv).first()
        creator_name = creator.TenNV if creator else None
        
        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="CREATE",
                entity="Project",
                entity_id=str(new_project.MaProject),
                details=f"Created project: {new_project.TenProject}",
            )
        except Exception:
            pass
        
        return ProjectResponse(
            MaProject=new_project.MaProject,
            TenProject=new_project.TenProject,
            MoTa=new_project.MoTa,
            TrangThai=new_project.TrangThai,
            NgayTao=new_project.NgayTao,
            NgayCapNhat=new_project.NgayCapNhat,
            MaNVCreate=new_project.MaNVCreate,
            TenNVCreate=creator_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo dự án: {str(e)}"
        )

# =====================================================
# 📖 Get All Projects (Admin Only)
# =====================================================

@router.get("/", response_model=list, summary="Lấy danh sách tất cả dự án")
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả dự án. Chỉ Admin mới có quyền xem.
    """
    # Role check: Only Admin can view all projects
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền xem danh sách dự án"
        )
    
    try:
        projects = db.query(Project).filter(Project.IsDelete == False).order_by(Project.NgayTao.desc()).all()
        
        result = []
        for project in projects:
            creator_name = None
            if project.MaNVCreate:
                creator = db.query(NhanVien).filter(NhanVien.MaNV == project.MaNVCreate).first()
                creator_name = creator.TenNV if creator else None
            
            result.append({
                "MaProject": project.MaProject,
                "TenProject": project.TenProject,
                "MoTa": project.MoTa,
                "TrangThai": project.TrangThai,
                "NgayTao": project.NgayTao.isoformat() if project.NgayTao else None,
                "NgayCapNhat": project.NgayCapNhat.isoformat() if project.NgayCapNhat else None,
                "MaNVCreate": project.MaNVCreate,
                "TenNVCreate": creator_name
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách dự án: {str(e)}"
        )

# =====================================================
# 📖 Get One Project (Admin Only)
# =====================================================

@router.get("/{maproject}", response_model=dict, summary="Lấy thông tin một dự án")
def get_project(
    maproject: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy thông tin chi tiết một dự án. Chỉ Admin mới có quyền xem.
    """
    # Role check: Only Admin can view project details
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền xem thông tin dự án"
        )
    
    try:
        project = db.query(Project).filter(
            Project.MaProject == maproject,
            Project.IsDelete == False
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dự án không tồn tại"
            )
        
        creator_name = None
        if project.MaNVCreate:
            creator = db.query(NhanVien).filter(NhanVien.MaNV == project.MaNVCreate).first()
            creator_name = creator.TenNV if creator else None
        
        return {
            "MaProject": project.MaProject,
            "TenProject": project.TenProject,
            "MoTa": project.MoTa,
            "TrangThai": project.TrangThai,
            "NgayTao": project.NgayTao.isoformat() if project.NgayTao else None,
            "NgayCapNhat": project.NgayCapNhat.isoformat() if project.NgayCapNhat else None,
            "MaNVCreate": project.MaNVCreate,
            "TenNVCreate": creator_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thông tin dự án: {str(e)}"
        )

# =====================================================
# ✏️ Update Project (Admin Only)
# =====================================================

@router.put("/{maproject}", response_model=dict, summary="Cập nhật thông tin dự án")
def update_project(
    maproject: int,
    project_data: ProjectUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật thông tin dự án. Chỉ Admin mới có quyền cập nhật.
    """
    # Role check: Only Admin can update projects
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền cập nhật dự án"
        )
    
    try:
        project = db.query(Project).filter(
            Project.MaProject == maproject,
            Project.IsDelete == False
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dự án không tồn tại"
            )
        
        # Validate status if provided
        if project_data.TrangThai:
            valid_statuses = ["Active", "Inactive", "Completed"]
            if project_data.TrangThai not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {', '.join(valid_statuses)}"
                )
        
        # Update fields
        if project_data.TenProject is not None:
            project.TenProject = project_data.TenProject
        if project_data.MoTa is not None:
            project.MoTa = project_data.MoTa
        if project_data.TrangThai is not None:
            project.TrangThai = project_data.TrangThai
        
        project.NgayCapNhat = datetime.utcnow()
        
        db.commit()
        db.refresh(project)
        
        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="UPDATE",
                entity="Project",
                entity_id=str(project.MaProject),
                details=f"Updated project: {project.TenProject}",
            )
        except Exception:
            pass
        
        creator_name = None
        if project.MaNVCreate:
            creator = db.query(NhanVien).filter(NhanVien.MaNV == project.MaNVCreate).first()
            creator_name = creator.TenNV if creator else None
        
        return {
            "MaProject": project.MaProject,
            "TenProject": project.TenProject,
            "MoTa": project.MoTa,
            "TrangThai": project.TrangThai,
            "NgayTao": project.NgayTao.isoformat() if project.NgayTao else None,
            "NgayCapNhat": project.NgayCapNhat.isoformat() if project.NgayCapNhat else None,
            "MaNVCreate": project.MaNVCreate,
            "TenNVCreate": creator_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật dự án: {str(e)}"
        )

# =====================================================
# 🗑️ Delete Project (Admin Only - Soft Delete)
# =====================================================

@router.delete("/{maproject}", response_model=dict, summary="Xóa dự án")
def delete_project(
    maproject: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Xóa dự án (soft delete). Chỉ Admin mới có quyền xóa.
    """
    # Role check: Only Admin can delete projects
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền xóa dự án"
        )
    
    try:
        project = db.query(Project).filter(
            Project.MaProject == maproject,
            Project.IsDelete == False
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dự án không tồn tại"
            )
        
        # Soft delete
        project.IsDelete = True
        project.NgayCapNhat = datetime.utcnow()
        
        db.commit()
        
        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="DELETE",
                entity="Project",
                entity_id=str(maproject),
                details=f"Deleted project: {project.TenProject}",
            )
        except Exception:
            pass
        
        return {
            "message": "Đã xóa dự án thành công",
            "MaProject": maproject
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xóa dự án: {str(e)}"
        )

