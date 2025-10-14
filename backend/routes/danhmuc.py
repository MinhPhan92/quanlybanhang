from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import DanhMuc

router = APIRouter(prefix="/danhmuc", tags=["DanhMuc"])

# Create


@router.post("/", response_model=dict)
def create_danhmuc(danhmuc: dict, db: Session = Depends(get_db)):
    new_dm = DanhMuc(
        TenDanhMuc=danhmuc.get("TenDanhMuc"),
        IsDelete=danhmuc.get("IsDelete", 0)
    )
    db.add(new_dm)
    db.commit()
    db.refresh(new_dm)
    return {"MaDanhMuc": new_dm.MaDanhMuc}

# Read all


@router.get("/", response_model=list)
def get_all_danhmuc(db: Session = Depends(get_db)):
    dms = db.query(DanhMuc).filter(DanhMuc.IsDelete == 0).all()
    return [dm.__dict__ for dm in dms]

# Read one


@router.get("/{madanhmuc}", response_model=dict)
def get_danhmuc(madanhmuc: int, db: Session = Depends(get_db)):
    dm = db.query(DanhMuc).filter(DanhMuc.MaDanhMuc ==
                                  madanhmuc, DanhMuc.IsDelete == 0).first()
    if not dm:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại")
    return dm.__dict__

# Update


@router.put("/{madanhmuc}", response_model=dict)
def update_danhmuc(madanhmuc: int, danhmuc: dict, db: Session = Depends(get_db)):
    dm = db.query(DanhMuc).filter(DanhMuc.MaDanhMuc ==
                                  madanhmuc, DanhMuc.IsDelete == 0).first()
    if not dm:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại")
    for key, value in danhmuc.items():
        if hasattr(dm, key):
            setattr(dm, key, value)
    db.commit()
    db.refresh(dm)
    return dm.__dict__

# Delete (soft delete)


@router.delete("/{madanhmuc}", response_model=dict)
def delete_danhmuc(madanhmuc: int, db: Session = Depends(get_db)):
    dm = db.query(DanhMuc).filter(DanhMuc.MaDanhMuc ==
                                  madanhmuc, DanhMuc.IsDelete == 0).first()
    if not dm:
        raise HTTPException(status_code=404, detail="Danh mục không tồn tại")
    dm.IsDelete = 1
    db.commit()
    return {"message": "Đã xóa danh mục"}
