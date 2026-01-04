@echo off
chcp 65001 >nul
echo ========================================
echo   🚀 Khởi động hệ thống Quản lý Bán hàng
echo ========================================
echo.

:: Lưu thư mục gốc
set ROOT_DIR=%~dp0

:: Khởi động Backend (FastAPI + Uvicorn)
echo [1/2] Đang khởi động Backend (FastAPI)...
start "QLBH-Backend" cmd /k "cd /d %ROOT_DIR% && call .venv\Scripts\activate.bat && echo === BACKEND SERVER === && uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Đợi 2 giây để backend khởi động trước
timeout /t 2 /nobreak >nul

:: Khởi động Frontend (Next.js)
echo [2/2] Đang khởi động Frontend (Next.js)...
start "QLBH-Frontend" cmd /k "cd /d %ROOT_DIR% && echo === FRONTEND SERVER === && npm run dev"

:: Đợi 5 giây để Frontend khởi động
echo.
echo Đang đợi Frontend khởi động...
timeout /t 5 /nobreak >nul

:: Mở trình duyệt
echo Đang mở trình duyệt...
start "" http://localhost:3000

echo.
echo ========================================
echo   ✅ Đã khởi động cả Backend và Frontend
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Frontend: http://localhost:3000
echo.
echo   Để tắt tất cả, chạy: stop-all.bat
echo ========================================
