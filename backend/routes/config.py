from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict
from datetime import datetime

from backend.database import get_db
from backend.models import SystemConfig
from backend.routes.deps import get_current_user
from backend.utils.activity_logger import log_activity


router = APIRouter(prefix="/config", tags=["Config"])


class ConfigUpdateRequest(BaseModel):
    value: str


@router.get("/", response_model=Dict[str, str], summary="Xem tất cả cấu hình (Admin)")
def get_all_configs(db: Session = Depends(get_db), current_user: Dict = Depends(get_current_user)):
    if current_user.get("role") != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    items = db.query(SystemConfig).all()
    return {item.ConfigKey: item.ConfigValue for item in items}


@router.put("/{key}", response_model=Dict[str, str], summary="Cập nhật cấu hình theo key (Admin)")
def update_config(key: str, req: ConfigUpdateRequest, db: Session = Depends(get_db), current_user: Dict = Depends(get_current_user)):
    if current_user.get("role") != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    try:
        item = db.query(SystemConfig).filter(SystemConfig.ConfigKey == key).first()
        old_value = item.ConfigValue if item else None
        
        if item is None:
            item = SystemConfig(ConfigKey=key, ConfigValue=req.value, UpdatedAt=datetime.utcnow())
            db.add(item)
        else:
            item.ConfigValue = req.value
            item.UpdatedAt = datetime.utcnow()
        
        db.commit()
        db.refresh(item)
        
        # Log activity
        try:
            log_activity(
                db,
                current_user,
                action="UPDATE",
                entity="SystemConfig",
                entity_id=item.Id,
                details=f"Updated config '{key}': {old_value} -> {req.value}",
            )
        except Exception:
            pass  # Don't fail if logging fails
        
        return {item.ConfigKey: item.ConfigValue}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật cấu hình: {str(e)}"
        )


