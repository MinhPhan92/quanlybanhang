from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict

from backend.database import get_db
from backend.models import SystemConfig
from backend.routes.deps import get_current_user


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

    item = db.query(SystemConfig).filter(SystemConfig.ConfigKey == key).first()
    if item is None:
        item = SystemConfig(ConfigKey=key, ConfigValue=req.value)
        db.add(item)
    else:
        item.ConfigValue = req.value
    db.commit()
    return {item.ConfigKey: item.ConfigValue}


