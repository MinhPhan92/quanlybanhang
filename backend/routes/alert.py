from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict

from backend.database import get_db
from backend.models import SanPham, SystemConfig
from backend.routes.deps import get_current_user


router = APIRouter(prefix="/alerts", tags=["Alerts"])


def get_low_stock_threshold(db: Session, default_threshold: int = 5) -> int:
    cfg = db.query(SystemConfig).filter(SystemConfig.ConfigKey == "LOW_STOCK_THRESHOLD").first()
    try:
        return int(cfg.ConfigValue) if cfg and cfg.ConfigValue is not None else default_threshold
    except ValueError:
        return default_threshold


@router.get("/low-stock", response_model=List[Dict], summary="Danh sách sản phẩm sắp hết hàng")
def get_low_stock_alerts(db: Session = Depends(get_db), current_user: Dict = Depends(get_current_user)):
    # Admin, Manager can view alerts
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    threshold = get_low_stock_threshold(db)
    products = db.query(SanPham).filter(SanPham.IsDelete == False, SanPham.SoLuongTonKho <= threshold).all()

    results: List[Dict] = []
    for sp in products:
        results.append({
            "MaSP": sp.MaSP,
            "TenSP": sp.TenSP,
            "SoLuongTonKho": sp.SoLuongTonKho,
            "Threshold": threshold,
        })
    return results


