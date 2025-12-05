from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from backend.database import get_db
from backend.models import SystemLog, ActivityLog
from backend.routes.deps import get_current_user
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/logs", tags=["Logs"])

# =====================================================
# 📋 System Logs
# =====================================================

@router.get("/systemlog", summary="Lấy danh sách system logs (Admin only)")
def get_system_logs(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    level: Optional[str] = Query(None, description="Filter by level (INFO, WARNING, ERROR)"),
    endpoint: Optional[str] = Query(None, description="Filter by endpoint"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách system logs với các bộ lọc.
    Chỉ Admin mới có quyền xem.
    """
    # Role check: Only Admin can view system logs
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền xem system logs"
        )
    
    try:
        # Build query
        query = db.query(SystemLog)
        
        # Filter by date range
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(SystemLog.CreatedAt >= start_datetime)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Định dạng ngày bắt đầu không hợp lệ. Sử dụng YYYY-MM-DD"
                )
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(SystemLog.CreatedAt < end_datetime)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Định dạng ngày kết thúc không hợp lệ. Sử dụng YYYY-MM-DD"
                )
        
        # Filter by level
        if level:
            valid_levels = ["INFO", "WARNING", "ERROR"]
            if level.upper() not in valid_levels:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Level không hợp lệ. Các level hợp lệ: {', '.join(valid_levels)}"
                )
            query = query.filter(SystemLog.Level == level.upper())
        
        # Filter by endpoint
        if endpoint:
            query = query.filter(SystemLog.Endpoint.contains(endpoint))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        logs = query.order_by(SystemLog.CreatedAt.desc()).offset(offset).limit(limit).all()
        
        # Format response
        result = []
        for log in logs:
            result.append({
                "Id": log.Id,
                "Level": log.Level,
                "Endpoint": log.Endpoint,
                "Method": log.Method,
                "StatusCode": log.StatusCode,
                "RequestBody": log.RequestBody,
                "ResponseBody": log.ResponseBody,
                "ErrorMessage": log.ErrorMessage,
                "CreatedAt": log.CreatedAt.isoformat() if log.CreatedAt else None,
            })
        
        return {
            "logs": result,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy system logs: {str(e)}"
        )

# =====================================================
# 📋 Activity Logs
# =====================================================

@router.get("/activitylog", summary="Lấy danh sách activity logs (Admin only)")
def get_activity_logs(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    username: Optional[str] = Query(None, description="Filter by username"),
    role: Optional[str] = Query(None, description="Filter by role"),
    action: Optional[str] = Query(None, description="Filter by action"),
    entity: Optional[str] = Query(None, description="Filter by entity"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lấy danh sách activity logs với các bộ lọc.
    Chỉ Admin mới có quyền xem.
    """
    # Role check: Only Admin can view activity logs
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin mới có quyền xem activity logs"
        )
    
    try:
        # Build query
        query = db.query(ActivityLog)
        
        # Filter by date range
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(ActivityLog.CreatedAt >= start_datetime)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Định dạng ngày bắt đầu không hợp lệ. Sử dụng YYYY-MM-DD"
                )
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(ActivityLog.CreatedAt < end_datetime)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Định dạng ngày kết thúc không hợp lệ. Sử dụng YYYY-MM-DD"
                )
        
        # Filter by username
        if username:
            query = query.filter(ActivityLog.Username.contains(username))
        
        # Filter by role
        if role:
            query = query.filter(ActivityLog.Role == role)
        
        # Filter by action
        if action:
            query = query.filter(ActivityLog.Action.contains(action))
        
        # Filter by entity
        if entity:
            query = query.filter(ActivityLog.Entity == entity)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        logs = query.order_by(ActivityLog.CreatedAt.desc()).offset(offset).limit(limit).all()
        
        # Format response
        result = []
        for log in logs:
            result.append({
                "Id": log.Id,
                "UserId": log.UserId,
                "Username": log.Username,
                "Role": log.Role,
                "Action": log.Action,
                "Entity": log.Entity,
                "EntityId": log.EntityId,
                "Details": log.Details,
                "IP": log.IP,
                "UserAgent": log.UserAgent,
                "CreatedAt": log.CreatedAt.isoformat() if log.CreatedAt else None,
            })
        
        return {
            "logs": result,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy activity logs: {str(e)}"
        )

