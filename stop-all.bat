@echo off
chcp 65001 >nul
echo ========================================
echo   🛑 Dừng hệ thống Quản lý Bán hàng
echo ========================================
echo.

:: Tắt process Backend (uvicorn/python)
echo [1/4] Đang tắt Backend processes...
taskkill /F /IM uvicorn.exe 2>nul

:: Tắt process Frontend (node)
echo [2/4] Đang tắt Frontend processes...
taskkill /F /IM node.exe 2>nul

:: Đóng cửa sổ CMD Backend
echo [3/4] Đang đóng cửa sổ Backend...
taskkill /F /FI "WINDOWTITLE eq QLBH-Backend" 2>nul
taskkill /F /FI "WINDOWTITLE eq QLBH-Backend - cmd*" 2>nul

:: Đóng cửa sổ CMD Frontend
echo [4/4] Đang đóng cửa sổ Frontend...
taskkill /F /FI "WINDOWTITLE eq QLBH-Frontend" 2>nul
taskkill /F /FI "WINDOWTITLE eq QLBH-Frontend - cmd*" 2>nul

echo.
echo ========================================
echo   ✅ Đã tắt tất cả services
echo ========================================
echo.
timeout /t 2 /nobreak >nul
