# =====================================================
# 📁 backend/main.py
# =====================================================

import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Database & Models
from backend.database import engine
from backend import models

# Routers
from backend.routes import (
    auth,
    khachhang,
    nhanvien,
    danhmuc,
    sanpham,
    donhang,
    chitietdonhang,
    thanhtoan,
    baocao,
    promotion,
    inventory,
    danhgia,
    khieunai,
)

# =====================================================
# 🚀 1. Khởi tạo ứng dụng FastAPI
# =====================================================
app = FastAPI(
    title="Hệ thống Quản Lý Bán Hàng",
    description="API backend cho hệ thống quản lý bán hàng tích hợp AI & phân quyền",
    version="1.0.0",
)

# =====================================================
# 🌐 2. Cấu hình CORS
# =====================================================
# ⚠️ Khi deploy thật, nên thay allow_origins=["*"] bằng domain frontend cụ thể.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ví dụ: ["http://localhost:5500"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 🧱 3. Mount frontend tĩnh (dành cho demo hoặc test local)
# =====================================================
frontend_dir = Path(__file__).resolve().parents[1] / "frontend"
if frontend_dir.exists():
    app.mount("/frontend", StaticFiles(directory=str(frontend_dir)),
              name="frontend")

# =====================================================
# 🪵 4. Cấu hình logging (Ghi log ra file)
# =====================================================

log_dir = Path(__file__).resolve().parents[1] / "logs"
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    filename=log_dir / "activity.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# =====================================================
# 🔗 5. Đăng ký các routers (chia nhóm API theo chức năng)
# =====================================================
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(khachhang.router, prefix="/api/khachhang",
                   tags=["Khách hàng"])
app.include_router(nhanvien.router, prefix="/api/nhanvien", tags=["Nhân viên"])
app.include_router(danhmuc.router, prefix="/api/danhmuc", tags=["Danh mục"])
app.include_router(sanpham.router, prefix="/api/sanpham", tags=["Sản phẩm"])
app.include_router(donhang.router, prefix="/api/donhang", tags=["Đơn hàng"])
app.include_router(chitietdonhang.router,
                   prefix="/api/chitietdonhang", tags=["Chi tiết đơn hàng"])
app.include_router(thanhtoan.router, prefix="/api/thanhtoan",
                   tags=["Thanh toán"])
app.include_router(baocao.router, prefix="/api/baocao", tags=["Báo cáo"])
app.include_router(promotion.router, prefix="/api", tags=["Khuyến mãi"])
app.include_router(inventory.router, prefix="/api", tags=["Tồn kho"])
app.include_router(danhgia.router, prefix="/api", tags=["Đánh giá"])
app.include_router(khieunai.router, prefix="/api", tags=["Khiếu nại"])

# =====================================================
# 🧩 6. Sự kiện khởi động - tạo bảng CSDL nếu chưa có
# =====================================================


@app.on_event("startup")
def on_startup_create_db():
    """Tự động tạo các bảng trong CSDL nếu chưa tồn tại."""
    models.Base.metadata.create_all(bind=engine)
    logging.info("✅ Database tables checked/created successfully.")

# =====================================================
# 🏠 7. Route gốc - kiểm tra kết nối backend
# =====================================================


@app.get("/", tags=["Root"])
def root():
    logging.info("Root endpoint accessed.")
    return {"message": "✅ Backend FastAPI đã kết nối MySQL thành công!"}
