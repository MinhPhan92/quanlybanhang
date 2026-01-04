from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import SanPham, DanhMuc
from backend.routes.deps import get_current_user, get_current_user_optional
from backend.schemas import (
    ProductCreateRequest, 
    ProductUpdateRequest, 
    ProductResponse, 
    ProductListResponse
)
from backend.utils.activity_logger import log_activity
import json
from typing import Optional

router = APIRouter(tags=["SanPham"])

# =====================================================
# 🧩 Helper Functions for JSON Attributes
# =====================================================

def encode_attributes_to_mota(attributes: Optional[dict]) -> Optional[str]:
    """
    Encode attributes dictionary to JSON string for MoTa column.
    """
    if attributes is None:
        return None
    try:
        return json.dumps(attributes, ensure_ascii=False)
    except (TypeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid attributes format: {str(e)}"
        )

def decode_attributes_from_mota(mota: Optional[str]) -> Optional[dict]:
    """
    Decode JSON string from MoTa column to attributes dictionary.
    """
    if not mota or mota.strip() == "":
        return None
    try:
        return json.loads(mota)
    except (json.JSONDecodeError, TypeError):
        # If MoTa is not valid JSON, return it as a simple string
        return {"description": mota}

def format_product_response(sp: SanPham, include_attributes: bool = True) -> dict:
    """
    Format product response with optional attributes decoding.
    """
    response = {
        "MaSP": sp.MaSP,
        "TenSP": sp.TenSP,
        "GiaSP": float(sp.GiaSP) if sp.GiaSP else 0.0,
        "SoLuongTonKho": sp.SoLuongTonKho,
        "MoTa": sp.MoTa,
        "HinhAnh": sp.HinhAnh,  # Thêm trường HinhAnh
        "MaDanhMuc": sp.MaDanhMuc,
        "IsDelete": sp.IsDelete
    }
    
    # Add category name if available
    if sp.danhmuc:
        response["TenDanhMuc"] = sp.danhmuc.TenDanhMuc
    
    # Decode attributes if requested
    if include_attributes:
        response["attributes"] = decode_attributes_from_mota(sp.MoTa)
    else:
        response["attributes"] = None
    
    return response

# =====================================================
# 🧾 Routes
# =====================================================

# Create


@router.post("/", response_model=ProductResponse, summary="Tạo sản phẩm mới")
def create_sanpham(
    product_data: ProductCreateRequest, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Tạo sản phẩm mới với thuộc tính JSON.
    Thuộc tính sẽ được mã hóa JSON và lưu vào cột MoTa.
    """
    # Role check: Only Admin and Manager can create products
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        # Encode attributes to JSON string for MoTa column
        mota_json = encode_attributes_to_mota(product_data.attributes)
        
        # Create new product
        new_sp = SanPham(
            TenSP=product_data.TenSP,
            GiaSP=product_data.GiaSP,
            SoLuongTonKho=product_data.SoLuongTonKho,
            MoTa=mota_json,  # Store JSON-encoded attributes
            HinhAnh=product_data.HinhAnh,  # Lưu đường dẫn ảnh
            MaDanhMuc=product_data.MaDanhMuc,
            IsDelete=False
        )
        
        db.add(new_sp)
        db.commit()
        db.refresh(new_sp)

        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="CREATE",
                entity="SanPham",
                entity_id=new_sp.MaSP,
                details=f"Created product '{new_sp.TenSP}'",
            )
        except Exception:
            pass
        
        # Return formatted response with decoded attributes
        return format_product_response(new_sp, include_attributes=True)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo sản phẩm: {str(e)}"
        )

# Read all


@router.get("/", response_model=ProductListResponse, summary="Lấy danh sách sản phẩm")
def get_all_sanpham(
    include_attributes: bool = False,
    page: int = 1,
    limit: int = 10,
    madanhmuc: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """
    Lấy danh sách sản phẩm với tùy chọn bao gồm thuộc tính và bộ lọc.

    - Public access - không yêu cầu đăng nhập.
    - Hỗ trợ bộ lọc theo:
        * madanhmuc: mã danh mục
        * min_price, max_price: khoảng giá
        * search: tìm kiếm theo tên sản phẩm (TenSP)

    Ví dụ:
    /api/sanpham/?madanhmuc=1
    /api/sanpham/?min_price=0&max_price=2000000
    /api/sanpham/?search=tu&madanhmuc=1
    """
    try:
        # Base query (chỉ lấy sản phẩm chưa xóa)
        query = db.query(SanPham).filter(SanPham.IsDelete == False)

        # Áp dụng bộ lọc danh mục nếu có
        if madanhmuc is not None:
            query = query.filter(SanPham.MaDanhMuc == madanhmuc)

        # Áp dụng bộ lọc giá nếu có
        if min_price is not None:
            query = query.filter(SanPham.GiaSP >= min_price)
        if max_price is not None:
            query = query.filter(SanPham.GiaSP <= max_price)

        # Áp dụng bộ lọc tìm kiếm theo tên sản phẩm nếu có
        if search:
            like_pattern = f"%{search}%"
            query = query.filter(SanPham.TenSP.ilike(like_pattern))

        # Đếm tổng sau khi áp dụng filter
        total = query.count()

        # Apply pagination
        offset = (page - 1) * limit
        sps = query.offset(offset).limit(limit).all()

        # Format products with optional attributes decoding
        products = []
        for sp in sps:
            product_data = format_product_response(
                sp, include_attributes=include_attributes
            )
            products.append(ProductResponse(**product_data))

        return ProductListResponse(products=products, total=total)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy danh sách sản phẩm: {str(e)}",
        )

# Read one


@router.get("/{masp}", response_model=ProductResponse, summary="Xem chi tiết sản phẩm")
def get_sanpham(
    masp: int, 
    db: Session = Depends(get_db), 
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Xem chi tiết sản phẩm với thuộc tính đã giải mã.
    Public access - không yêu cầu đăng nhập.
    """
    try:
        sp = db.query(SanPham).filter(
            SanPham.MaSP == masp, 
            SanPham.IsDelete == False
        ).first()
        
        if not sp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Sản phẩm không tồn tại"
            )
        
        # Return formatted response with decoded attributes
        product_data = format_product_response(sp, include_attributes=True)
        return ProductResponse(**product_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi lấy thông tin sản phẩm: {str(e)}"
        )

# Check availability (for cart validation)
@router.get("/{masp}/check-availability", summary="Kiểm tra tồn kho và giá sản phẩm")
def check_product_availability(
    masp: int,
    quantity: int = 1,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Kiểm tra sản phẩm có sẵn không, giá hiện tại, và tồn kho.
    Dùng để validate giỏ hàng.
    """
    try:
        sp = db.query(SanPham).filter(SanPham.MaSP == masp).first()
        
        if not sp:
            return {
                "available": False,
                "reason": "Sản phẩm không tồn tại",
                "MaSP": masp
            }
        
        if sp.IsDelete:
            return {
                "available": False,
                "reason": "Sản phẩm đã ngừng kinh doanh",
                "MaSP": masp,
                "TenSP": sp.TenSP
            }
        
        if sp.SoLuongTonKho < quantity:
            return {
                "available": False,
                "reason": f"Không đủ hàng. Chỉ còn {sp.SoLuongTonKho} sản phẩm",
                "MaSP": masp,
                "TenSP": sp.TenSP,
                "GiaSP": float(sp.GiaSP) if sp.GiaSP else 0.0,
                "SoLuongTonKho": sp.SoLuongTonKho,
                "HinhAnh": sp.HinhAnh
            }
        
        return {
            "available": True,
            "MaSP": sp.MaSP,
            "TenSP": sp.TenSP,
            "GiaSP": float(sp.GiaSP) if sp.GiaSP else 0.0,
            "SoLuongTonKho": sp.SoLuongTonKho,
            "HinhAnh": sp.HinhAnh
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi kiểm tra sản phẩm: {str(e)}"
        )

# Update


@router.put("/{masp}", response_model=ProductResponse, summary="Cập nhật sản phẩm")
def update_sanpham(
    masp: int, 
    product_data: ProductUpdateRequest, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật sản phẩm với thuộc tính JSON mới.
    Thuộc tính sẽ được mã hóa JSON và cập nhật vào cột MoTa.
    """
    # Role check: Only Admin and Manager can update products
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        sp = db.query(SanPham).filter(
            SanPham.MaSP == masp, 
            SanPham.IsDelete == False
        ).first()
        
        if not sp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Sản phẩm không tồn tại"
            )
        
        # Update basic fields
        if product_data.TenSP is not None:
            sp.TenSP = product_data.TenSP
        if product_data.GiaSP is not None:
            sp.GiaSP = product_data.GiaSP
        if product_data.SoLuongTonKho is not None:
            sp.SoLuongTonKho = product_data.SoLuongTonKho
        if product_data.MaDanhMuc is not None:
            sp.MaDanhMuc = product_data.MaDanhMuc
        if product_data.HinhAnh is not None:
            sp.HinhAnh = product_data.HinhAnh
        
        # Handle attributes update
        if product_data.attributes is not None:
            # Encode new attributes to JSON string
            mota_json = encode_attributes_to_mota(product_data.attributes)
            sp.MoTa = mota_json
        elif product_data.MoTa is not None:
            # If MoTa is provided directly, use it
            sp.MoTa = product_data.MoTa
        
        db.commit()
        db.refresh(sp)

        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="UPDATE",
                entity="SanPham",
                entity_id=sp.MaSP,
                details=f"Updated product '{sp.TenSP}'",
            )
        except Exception:
            pass
        
        # Return formatted response with decoded attributes
        product_data_response = format_product_response(sp, include_attributes=True)
        return ProductResponse(**product_data_response)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi cập nhật sản phẩm: {str(e)}"
        )

# Delete (soft delete)


@router.delete("/{masp}", response_model=dict, summary="Xóa sản phẩm")
def delete_sanpham(
    masp: int, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Xóa sản phẩm (soft delete).
    """
    # Role check: Only Admin can delete products
    if current_user.get("role") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Permission denied"
        )
    
    try:
        sp = db.query(SanPham).filter(
            SanPham.MaSP == masp, 
            SanPham.IsDelete == False
        ).first()
        
        if not sp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Sản phẩm không tồn tại"
            )
        
        sp.IsDelete = True
        db.commit()

        # Activity log
        try:
            log_activity(
                db,
                current_user,
                action="DELETE",
                entity="SanPham",
                entity_id=sp.MaSP,
                details=f"Soft-deleted product '{sp.TenSP}'",
            )
        except Exception:
            pass
        
        return {"message": "Đã xóa sản phẩm thành công"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xóa sản phẩm: {str(e)}"
        )
