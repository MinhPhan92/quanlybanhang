# =====================================================
# 📁 backend/routes/upload.py
# Upload hình ảnh sản phẩm
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from backend.routes.deps import get_current_user
from PIL import Image
import os
import uuid
from pathlib import Path
import io

router = APIRouter(tags=["Upload"])

# Kích thước ảnh sản phẩm (tương ứng với product card)
# Mobile: 208x208, Desktop: 240x240 => Dùng 300x300 để đảm bảo chất lượng
PRODUCT_IMAGE_SIZE = (300, 300)

# Thư mục lưu ảnh sản phẩm
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "public" / "productimg"

# Đảm bảo thư mục tồn tại
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Các định dạng ảnh được phép
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def resize_and_crop_image(image: Image.Image, target_size: tuple) -> Image.Image:
    """
    Resize và crop ảnh về kích thước cố định, giữ tỷ lệ và crop center.
    """
    target_width, target_height = target_size
    
    # Convert to RGB if necessary (for PNG with transparency)
    if image.mode in ('RGBA', 'LA', 'P'):
        # Create white background
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Calculate aspect ratios
    img_width, img_height = image.size
    img_ratio = img_width / img_height
    target_ratio = target_width / target_height
    
    # Resize keeping aspect ratio, then crop
    if img_ratio > target_ratio:
        # Image is wider - resize by height, crop width
        new_height = target_height
        new_width = int(new_height * img_ratio)
    else:
        # Image is taller - resize by width, crop height
        new_width = target_width
        new_height = int(new_width / img_ratio)
    
    # Resize
    image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Crop center
    left = (new_width - target_width) // 2
    top = (new_height - target_height) // 2
    right = left + target_width
    bottom = top + target_height
    
    image = image.crop((left, top, right, bottom))
    
    return image


@router.post("/product-image", summary="Upload ảnh sản phẩm")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload và xử lý ảnh sản phẩm:
    - Resize về kích thước cố định 300x300
    - Crop center để giữ tỷ lệ
    - Lưu vào public/productimg/
    - Trả về đường dẫn tương đối
    """
    # Role check: Only Admin and Manager can upload
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền upload ảnh"
        )
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Định dạng file không hợp lệ. Chỉ chấp nhận: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File quá lớn. Kích thước tối đa: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Open image
        image = Image.open(io.BytesIO(content))
        
        # Resize and crop
        processed_image = resize_and_crop_image(image, PRODUCT_IMAGE_SIZE)
        
        # Generate unique filename
        unique_id = uuid.uuid4().hex[:8]
        # Sanitize original filename
        original_name = os.path.splitext(file.filename)[0]
        safe_name = "".join(c if c.isalnum() or c in "-_" else "-" for c in original_name)[:30]
        new_filename = f"{safe_name}-{unique_id}.jpg"
        
        # Save as JPEG with good quality
        file_path = UPLOAD_DIR / new_filename
        processed_image.save(file_path, "JPEG", quality=85, optimize=True)
        
        # Return relative path for frontend
        return {
            "success": True,
            "filename": new_filename,
            "path": f"/productimg/{new_filename}",
            "size": PRODUCT_IMAGE_SIZE,
            "message": "Upload thành công"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xử lý ảnh: {str(e)}"
        )


@router.delete("/product-image/{filename}", summary="Xóa ảnh sản phẩm")
async def delete_product_image(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Xóa ảnh sản phẩm khỏi server.
    """
    # Role check
    if current_user.get("role") not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền xóa ảnh"
        )
    
    # Validate filename (prevent path traversal)
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên file không hợp lệ"
        )
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy file"
        )
    
    try:
        os.remove(file_path)
        return {
            "success": True,
            "message": "Xóa ảnh thành công"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xóa file: {str(e)}"
        )
