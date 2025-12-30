# =====================================================
# 📁 backend/main.py
# =====================================================

import logging
from pathlib import Path
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import time
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.routes.deps import get_current_user
from backend.models import SystemLog

# Database & Models
from backend.database import engine
import backend.models as models

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
    config,
    alert,
    chatbot,
)

from backend.routes.chatbot import load_chatbot_knowledge

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
# 🧩 4.5 Middleware ghi SystemLog (F22)
# =====================================================


@app.middleware("http")
async def system_logging_middleware(request: Request, call_next):
    start_time = time.time()
    method = request.method
    endpoint = request.url.path

    # Best-effort read body (without consuming it for downstream)
    try:
        body_bytes = await request.body()
        request_body_str = body_bytes.decode("utf-8", errors="ignore") if body_bytes else None
    except Exception:
        request_body_str = None

    try:
        response = await call_next(request)
        status_code = response.status_code
        level = "INFO"
        error_message = None
    except Exception as exc:
        status_code = 500
        level = "ERROR"
        error_message = str(exc)
        # Persist error log
        db: Session = SessionLocal()
        try:
            log = SystemLog(
                Level=level,
                Endpoint=endpoint,
                Method=method,
                StatusCode=status_code,
                RequestBody=request_body_str,
                ResponseBody=None,
                ErrorMessage=error_message,
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()
        raise
    finally:
        duration_ms = int((time.time() - start_time) * 1000)
        logging.info(f"{method} {endpoint} completed in {duration_ms}ms")

    # Log warnings/errors for 4xx/5xx responses
    if status_code >= 400:
        level = "ERROR" if status_code >= 500 else "WARNING"
        db: Session = SessionLocal()
        try:
            log = SystemLog(
                Level=level,
                Endpoint=endpoint,
                Method=method,
                StatusCode=status_code,
                RequestBody=request_body_str,
                ResponseBody=None,
                ErrorMessage=None,
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    return response

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
app.include_router(config.router, prefix="/api", tags=["Config"])
app.include_router(alert.router, prefix="/api", tags=["Alerts"])
app.include_router(chatbot.router, prefix="/api", tags=["Chatbot"])
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


@app.get("/api/status", tags=["Root"], summary="Trạng thái hệ thống")
def api_status(current_user: dict = Depends(get_current_user)):
    return {
        "status": "ok",
        "version": "1.0.0",
        "user": current_user,
    }
    
@app.on_event("startup")
def startup_event():
    load_chatbot_knowledge()
    logging.info("Chatbot knowledge loaded successfully.")
