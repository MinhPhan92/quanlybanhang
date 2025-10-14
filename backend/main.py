from fastapi.middleware.cors import CORSMiddleware
from backend.routes.auth import router as auth_router
from backend.routes.baocao import router as baocao_router
from backend.routes.thanhtoan import router as thanhtoan_router
from backend.routes.chitietdonhang import router as chitietdonhang_router
from backend.routes.donhang import router as donhang_router
from backend.routes.sanpham import router as sanpham_router
from backend.routes.danhmuc import router as danhmuc_router
from backend.routes.nhanvien import router as nhanvien_router
from backend.routes.khachhang import router as khachhang_router
from fastapi import FastAPI
from backend.database import engine
from backend import models

# Nếu models có, tạo bảng tương ứng (tự động)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hệ thống Quản Lý Bán Hàng")

# Import and register routers

app.include_router(khachhang_router)
app.include_router(nhanvien_router)
app.include_router(danhmuc_router)
app.include_router(sanpham_router)
app.include_router(donhang_router)
app.include_router(chitietdonhang_router)
app.include_router(thanhtoan_router)
app.include_router(baocao_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "Backend FastAPI đã kết nối MySQL thành công!"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
