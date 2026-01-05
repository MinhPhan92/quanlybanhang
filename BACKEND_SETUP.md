# Hướng dẫn cài đặt Backend

## Yêu cầu

- Python 3.8+
- MySQL 5.7+
- Git

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/MinhPhan92/quanlybanhang.git
cd quanlybanhang
```

### 2. Tạo virtual environment

Windows:
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Linux/MacOS:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Cài đặt dependencies

```bash
pip install fastapi uvicorn sqlalchemy pymysql passlib python-jose python-multipart httpx sqlglot
```

### 4. Tạo database

```sql
CREATE DATABASE quanlybanhang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Cấu hình database

Mở file `backend/database.py` và sửa connection string:

```python
DATABASE_URL = "mysql+pymysql://username:password@localhost:3306/quanlybanhang"
```

Thay thế:
- `username`: MySQL username (mặc định: root)
- `password`: MySQL password
- `localhost`: MySQL host
- `3306`: MySQL port
- `quanlybanhang`: Database name

### 6. Chạy server

```bash
uvicorn backend.main:app --reload
```

Hoặc:

```bash
.\.venv\Scripts\uvicorn.exe backend.main:app --reload
```

Server chạy tại: http://localhost:8000

### 7. Test API

Swagger UI: http://localhost:8000/docs

## Lưu ý

- Database tables sẽ tự động tạo khi server khởi động lần đầu
- Nếu gặp lỗi schema conflicts, xóa database và tạo lại
- Đảm bảo chạy lệnh từ thư mục gốc của project (không phải từ thư mục backend/)

## Troubleshooting

**Lỗi: ModuleNotFoundError**
```bash
.\.venv\Scripts\Activate.ps1
pip install <package_name>
```

**Lỗi: Can't connect to MySQL**
- Kiểm tra MySQL đang chạy
- Kiểm tra thông tin trong `backend/database.py`

**Server tự động tắt**
```bash
uvicorn backend.main:app --reload --port 8001
```
