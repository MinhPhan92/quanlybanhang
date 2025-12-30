# Quản Lý Bán Hàng - E-commerce Platform

Hệ thống quản lý bán hàng đồ gia dụng được xây dựng với Next.js và FastAPI.

## 🚀 Tính năng

### Frontend (Next.js)
- **Trang chủ**: Hiển thị sản phẩm nổi bật
- **Cửa hàng**: Duyệt và tìm kiếm sản phẩm
- **Chi tiết sản phẩm**: Xem thông tin chi tiết, đánh giá
- **Giỏ hàng**: Quản lý sản phẩm trong giỏ hàng
- **Thanh toán**: Quy trình checkout hoàn chỉnh
- **Đơn hàng**: 
  - Lịch sử đơn hàng
  - Chi tiết đơn hàng
  - Theo dõi đơn hàng
  - Hóa đơn/Receipt
- **Tài khoản**:
  - Đăng nhập/Đăng ký
  - Quên mật khẩu/Đặt lại mật khẩu
  - Quản lý địa chỉ
  - Hồ sơ người dùng
- **Admin Dashboard**: Quản lý sản phẩm, đơn hàng, khách hàng, nhân viên

### Backend (FastAPI)
- RESTful API với JWT authentication
- Quản lý sản phẩm, danh mục
- Quản lý đơn hàng và thanh toán
- Quản lý giỏ hàng
- Quản lý khách hàng và nhân viên
- Hệ thống khuyến mãi/voucher
- Activity logging
- Inventory management

## 📋 Yêu cầu

- Node.js 18+ 
- Python 3.8+
- MySQL/MariaDB

## 🛠️ Cài đặt

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Tạo file `.env` trong thư mục `backend`:
```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/db_name
SECRET_KEY=your-secret-key
```

- Chạy file `db/db-ban-do-gia-dung.sql` trên MySQL để tạo database và các bảng.
- Nếu DB hiện tại đang bị giới hạn mô tả sản phẩm (cột `SanPham.MoTa`), hãy chạy migration:
  - `db/migrations/2025-12-17_alter_sanpham_mota_text.sql`

Chạy backend:
```bash
uvicorn main:app --reload
```

Backend sẽ chạy tại `http://localhost:8000`

### Frontend

```bash
npm install
```

Tạo file `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Chạy frontend:
```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

## 📁 Cấu trúc dự án

```
quanlybanhang/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth, Cart)
│   ├── lib/               # Utilities and API clients
│   └── [pages]/           # Public pages
├── backend/                # FastAPI backend
│   ├── routes/            # API routes
│   ├── models.py          # Database models
│   ├── database.py        # Database connection
│   └── main.py            # FastAPI app
├── public/                 # Static assets
└── db/                     # Database scripts
```

## 🔐 Authentication

Hệ thống sử dụng JWT tokens cho authentication. Token được lưu trong `localStorage` sau khi đăng nhập.

## 📝 API Documentation

API documentation có sẵn tại:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🧪 Testing

Chạy linter:
```bash
npm run lint
```

## 📄 License

Private project

- Đảm bảo backend và MySQL đều đang chạy.

## Export DB (.sql) để gửi team

### Cách nhanh (MySQL Workbench)
- Server → Data Export → chọn schema `QuanLyBanHang` → Export to Self-Contained File (`.sql`).

### Cách CLI (mysqldump)

```bash
mysqldump -u root -p QuanLyBanHang > QuanLyBanHang_export.sql
```

## Tác giả

MinhPhan92
