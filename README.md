# Quan Ly Ban Hang - E-commerce Platform

He thong quan ly ban hang do gia dung duoc xay dung voi Next.js va FastAPI.

## Yeu cau

- Node.js 18+
- Python 3.8+
- MySQL/MariaDB

## Cai dat

### 1. Clone du an

```bash
git clone <repository-url>
cd quanlybanhang
```

### 2. Cai dat Backend

```bash
# Tao virtual environment (khuyen nghi)
python -m venv .venv

# Kich hoat virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Cai dat cac thu vien (file requirements.txt o thu muc goc)
pip install -r requirements.txt
```

Tao file `.env` trong thu muc goc (tuy chon):

```
DB_USER=root
DB_PASSWORD=1234
DB_HOST=localhost
DB_PORT=3306
DB_NAME=QuanLyBanHang
SECRET_KEY=your-secret-key
```

Neu khong tao file `.env`, he thong se dung gia tri mac dinh trong `backend/database.py`.

### 3. Cai dat Database

**Buoc 1**: Chay file chinh de tao database va cac bang:

```bash
mysql -u root -p < db/db-ban-do-gia-dung.sql
```

**Buoc 2**: Chay cac file migration (BAT BUOC neu database moi):

```bash
# Mo rong cot MoTa tu VARCHAR(255) sang TEXT
mysql -u root -p QuanLyBanHang < db/migrations/2025-12-17_alter_sanpham_mota_text.sql

# Them cot HinhAnh vao bang SanPham (luu anh san pham)
mysql -u root -p QuanLyBanHang < db/migrations/2026-01-04_add_hinhanh_to_sanpham.sql

# Tao bang PaymentTransaction (thanh toan QR)
mysql -u root -p QuanLyBanHang < db/migrations/2026-01-04_create_payment_transaction.sql
```

**Luu y**: Neu da co database cu, chi can chay cac migration chua co. Kiem tra bang cau lenh:

```bash
mysql -u root -p QuanLyBanHang -e "DESCRIBE SanPham;"
mysql -u root -p QuanLyBanHang -e "SHOW TABLES LIKE 'PaymentTransaction';"
```

**Buoc 3** (tuy chon): Them du lieu mau:

```bash
mysql -u root -p QuanLyBanHang < db/insert-sample-data.sql
```

### 4. Chay Backend

```bash
cd backend
uvicorn main:app --reload
```

Backend se chay tai `http://localhost:8000`

### 5. Cai dat Frontend

```bash
npm install
```

Tao file `.env.local` (tuy chon):

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 6. Chay Frontend

```bash
npm run dev
```

Frontend se chay tai `http://localhost:3000`

### 7. Chay nhanh (Windows)

Su dung file batch de khoi dong ca backend va frontend:

```bash
.\start-all.bat
```

Dung tat ca:

```bash
.\stop-all.bat
```

## Cau truc thu muc

```
quanlybanhang/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts (Auth, Cart)
│   ├── lib/               # Utilities and API clients
│   └── [pages]/           # Public pages
├── backend/               # FastAPI backend
│   ├── routes/            # API routes
│   ├── models.py          # Database models
│   ├── database.py        # Database connection
│   └── main.py            # FastAPI app
├── public/                # Static assets
│   └── productimg/        # Thu muc luu anh san pham upload
└── db/                    # Database scripts
    └── migrations/        # Cac file migration
```

## API Documentation

API documentation co san tai:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Dang ky tai khoan Admin

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "SdtNV": "0999888777",
    "password": "admin123",
    "TenNV": "Admin System",
    "ChucVu": "Admin"
  }'
```

Sau do dang nhap tai `http://localhost:3000/login` va truy cap admin tai `http://localhost:3000/admin`.

## Export DB (.sql) de gui team

### Cach nhanh (MySQL Workbench)

- Server -> Data Export -> chon schema `QuanLyBanHang` -> Export to Self-Contained File (`.sql`).

### Cach CLI (mysqldump)

```bash
mysqldump -u root -p QuanLyBanHang > QuanLyBanHang_export.sql
```

## Tac gia

MinhPhan92
