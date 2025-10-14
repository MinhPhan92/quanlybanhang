# Quản Lý Bán Hàng

Web bán đồ gia dụng - Project

## Mô tả

Đây là dự án quản lý bán hàng sử dụng FastAPI (backend) và HTML/JavaScript (frontend). Dữ liệu được lưu trữ trong MySQL.

## Cấu trúc thư mục

quanlybanhang/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── routes/
│   │   ├── khachhang.py
│   │   ├── nhanvien.py
│   │   ├── danhmuc.py
│   │   ├── sanpham.py
│   │   ├── donhang.py
│   │   ├── chitietdonhang.py
│   │   ├── thanhtoan.py
│   │   ├── baocao.py
│   │   └── auth.py
│   └── ...
├── frontend/
│   ├── index.html
│   └── test.js
├── db/
│   └── schema.sql
└── README.md

## Hướng dẫn chạy dự án

### 1. Cài đặt các package cần thiết

```bash
pip install fastapi uvicorn sqlalchemy pymysql passlib python-jose
```

### 2. Khởi tạo database MySQL

- Chạy file `db/schema.sql` trên MySQL để tạo database và các bảng.

### 3. Cấu hình kết nối database

- Sửa thông tin kết nối trong `backend/database.py` cho phù hợp với MySQL của bạn.

### 4. Chạy backend FastAPI

- Mở terminal tại thư mục dự án hoặc thư mục `backend`:
  - Nếu ở thư mục dự án (project root):

      ```bash
      uvicorn backend.main:app --reload
      ```

  - Nếu ở thư mục `backend`:

      ```bash
      uvicorn main:app --reload
      ```

### 5. Truy cập Swagger UI để test API

- Mở trình duyệt và truy cập: [http://localhost:8000/docs](http://localhost:8000/docs)

### 6. Chạy frontend để test chức năng

- Mở terminal tại thư mục `frontend`:

  ```bash
  python -m http.server 8080
  ```

- Truy cập [http://localhost:8080/index.html](http://localhost:8080/index.html) để sử dụng giao diện test CRUD.

## Ghi chú

- Nếu sử dụng Live Server hoặc chạy frontend trên port khác, hãy đảm bảo đã bật CORS trong `main.py`:

  ```python
  from fastapi.middleware.cors import CORSMiddleware

  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

- Đảm bảo backend và MySQL đều đang chạy.

## Tác giả

MinhPhan92
