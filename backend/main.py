# =====================================================
# 📁 backend/main.py
# =====================================================

import sys
from pathlib import Path

# Add project root to Python path to allow imports when running from backend directory
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import logging
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.routes.deps import get_current_user
from backend.models import SystemLog

# Database & Models
from backend.database import engine
from backend import models
from contextlib import asynccontextmanager

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
    project,
    logs,
    contact,
    giohang,
)

from backend.routes.chatbot import load_chatbot_knowledge

# =====================================================
# 🚀 1. Khởi tạo ứng dụng FastAPI (sử dụng lifespan thay cho on_event startup)
# =====================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan khởi tạo tài nguyên (thay cho @app.on_event('startup'))."""
    # Tự động tạo các bảng trong CSDL nếu chưa tồn tại.
    models.Base.metadata.create_all(bind=engine)
    logging.info("✅ Database tables checked/created successfully (lifespan).")
    yield


app = FastAPI(
    title="Hệ thống Quản Lý Bán Hàng",
    description="API backend cho hệ thống quản lý bán hàng tích hợp AI & phân quyền",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,  # Disable automatic trailing slash redirects to avoid CORS issues
)

# =====================================================
# 🌐 2. Cấu hình CORS
# =====================================================
# ⚠️ Khi deploy thật, nên thay allow_origins=["*"] bằng domain frontend cụ thể.
app.add_middleware(
    CORSMiddleware,
    # Temporarily allow all origins for debugging - change back to ["http://localhost:3000"] after fixing
    allow_origins=["*"],  # TODO: Change back to ["http://localhost:3000"] for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Exception handlers to ensure CORS headers are added to error responses
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    response = JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    response = JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

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
app.include_router(project.router, prefix="/api", tags=["Dự án"])
app.include_router(logs.router, prefix="/api", tags=["Logs"])
app.include_router(contact.router, prefix="/api/lienhe", tags=["Liên hệ"])
app.include_router(giohang.router, prefix="/api", tags=["Giỏ hàng"])

# =====================================================
# 🏠 7. Route gốc - kiểm tra kết nối backend
# =====================================================


@app.get("/", tags=["Root"])
def root():
    logging.info("Root endpoint accessed.")
    return {"message": "✅ Backend FastAPI đã kết nối MySQL thành công!"}


@app.get("/api/test-cors", tags=["Root"])
def test_cors():
    """Test endpoint to verify CORS is working."""
    return {"message": "CORS test successful", "cors_enabled": True}


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
