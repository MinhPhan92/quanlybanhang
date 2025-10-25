# 🛒 Hệ Thống Quản Lý Bán Hàng

**E-commerce Management System** - FastAPI Backend với MySQL Database

## 📋 Mô tả

Hệ thống quản lý bán hàng toàn diện với các tính năng:
- 🔐 **Authentication & Authorization** - JWT-based security với role-based access control
- 🛍️ **Product Management** - Quản lý sản phẩm với thuộc tính JSON linh hoạt
- 📦 **Order Management** - Xử lý đơn hàng với quản lý tồn kho tự động
- 💰 **Promotional System** - Hệ thống mã giảm giá và khuyến mãi
- 📊 **Inventory Management** - Quản lý tồn kho với transaction safety
- ⭐ **Customer Feedback** - Đánh giá sản phẩm và khiếu nại khách hàng
- 📈 **Reporting System** - Báo cáo doanh thu và thống kê

## 🏗️ Cấu trúc dự án

```
quanlybanhang/
├── 📁 backend/
│   ├── 🐍 main.py                 # FastAPI application entry point
│   ├── 🗃️ models.py              # SQLAlchemy database models
│   ├── 🗄️ database.py            # Database connection configuration
│   ├── 📋 schemas.py             # Pydantic request/response schemas
│   ├── 📁 routes/                # API route modules
│   │   ├── 🔐 auth.py            # Authentication & JWT
│   │   ├── 👥 khachhang.py       # Customer management
│   │   ├── 👨‍💼 nhanvien.py       # Employee management
│   │   ├── 📂 danhmuc.py         # Category management
│   │   ├── 🛍️ sanpham.py         # Product management with JSON attributes
│   │   ├── 📦 donhang.py         # Order management with inventory
│   │   ├── 📋 chitietdonhang.py  # Order details management
│   │   ├── 💳 thanhtoan.py       # Payment processing
│   │   ├── 📊 baocao.py          # Reporting & analytics
│   │   ├── 🎁 promotion.py       # Promotional vouchers
│   │   ├── 📦 inventory.py       # Inventory management
│   │   ├── ⭐ danhgia.py         # Product reviews
│   │   ├── 📝 khieunai.py        # Customer complaints
│   │   └── 🛡️ deps.py           # Security dependencies
│   └── 📁 utils/                 # Utility modules
│       ├── 🎁 promotion_data.py  # Mock voucher data
│       └── 📦 inventory_manager.py   # Inventory operations
├── 📁 frontend/
│   ├── 🌐 index.html            # Main frontend interface
│   └── 🧪 test.js               # Frontend testing utilities
├── 📁 db/
│   └── 🗃️ db-ban-do-gia-dung.sql # Database schema
├── 📁 logs/
│   └── 📄 activity.log          # Application logs
└── 📄 README.md                 # Project documentation
```

## 🚀 Tính năng chính

### 🔐 Authentication & Security
- **JWT Token Authentication** - Secure login với token-based auth
- **Role-Based Access Control** - Phân quyền Admin, Manager, Employee, Customer
- **Password Hashing** - Bảo mật mật khẩu với PBKDF2
- **Session Management** - Quản lý phiên đăng nhập an toàn

### 🛍️ Product Management
- **Flexible Attributes** - Thuộc tính sản phẩm JSON linh hoạt
- **Category Management** - Quản lý danh mục sản phẩm
- **Stock Tracking** - Theo dõi tồn kho tự động
- **Product Search** - Tìm kiếm và lọc sản phẩm

### 📦 Order Management
- **Order Processing** - Xử lý đơn hàng với workflow
- **Inventory Integration** - Tự động cập nhật tồn kho
- **Status Tracking** - Theo dõi trạng thái đơn hàng
- **Transaction Safety** - Đảm bảo tính nhất quán dữ liệu

### 💰 Promotional System
- **Voucher Management** - Quản lý mã giảm giá
- **Discount Calculation** - Tính toán giảm giá tự động
- **Usage Tracking** - Theo dõi sử dụng voucher
- **Flexible Rules** - Quy tắc khuyến mãi linh hoạt

### 📊 Inventory Management
- **Real-time Stock** - Cập nhật tồn kho thời gian thực
- **Low Stock Alerts** - Cảnh báo sắp hết hàng
- **Transaction Safety** - Rollback khi có lỗi
- **Stock Validation** - Kiểm tra tồn kho trước khi bán

### ⭐ Customer Feedback
- **Product Reviews** - Đánh giá sản phẩm với rating
- **Complaint System** - Hệ thống khiếu nại khách hàng
- **Staff Response** - Phản hồi từ nhân viên
- **Review Validation** - Chỉ khách hàng đã mua mới được đánh giá

### 📈 Reporting & Analytics
- **Revenue Reports** - Báo cáo doanh thu
- **Sales Analytics** - Phân tích bán hàng
- **Product Performance** - Hiệu suất sản phẩm
- **Customer Insights** - Thông tin khách hàng

## 🛠️ Hướng dẫn cài đặt và chạy

### 📋 Yêu cầu hệ thống
- **Python 3.8+**
- **MySQL 5.7+** hoặc **MySQL 8.0+**
- **Node.js** (cho frontend development)

### 1. 📦 Cài đặt dependencies

```bash
# Cài đặt Python packages
pip install fastapi uvicorn sqlalchemy pymysql passlib python-jose python-multipart

# Hoặc sử dụng requirements.txt
pip install -r requirements.txt
```

### 2. 🗄️ Thiết lập database

```bash
# 1. Tạo database MySQL
mysql -u root -p
CREATE DATABASE quanlybanhang;

# 2. Import schema
mysql -u root -p quanlybanhang < db/db-ban-do-gia-dung.sql
```

### 3. ⚙️ Cấu hình

Cập nhật thông tin kết nối database trong `backend/database.py`:

```python
DATABASE_URL = "mysql+pymysql://username:password@localhost:3306/quanlybanhang"
```

### 4. 🚀 Chạy ứng dụng

```bash
# Chạy backend FastAPI
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Chạy frontend (terminal khác)
cd frontend
python -m http.server 8080
```

### 5. 🌐 Truy cập ứng dụng

- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Frontend Interface**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **API Base URL**: [http://localhost:8000/api](http://localhost:8000/api)

## 📚 API Documentation

### 🔐 Authentication APIs

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/auth/register` | POST | Đăng ký tài khoản mới | Public |
| `/api/auth/login` | POST | Đăng nhập hệ thống | Public |

### 👥 Customer Management

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/customers/` | GET | Lấy danh sách khách hàng | Admin, Manager |
| `/api/customers/` | POST | Tạo khách hàng mới | Admin |
| `/api/customers/{id}` | GET | Xem thông tin khách hàng | All |
| `/api/customers/{id}` | PUT | Cập nhật khách hàng | All |
| `/api/customers/{id}` | DELETE | Xóa khách hàng | Admin |

### 🛍️ Product Management

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/sanpham/` | GET | Danh sách sản phẩm | All |
| `/api/sanpham/` | POST | Tạo sản phẩm mới | Admin, Manager |
| `/api/sanpham/{id}` | GET | Chi tiết sản phẩm | All |
| `/api/sanpham/{id}` | PUT | Cập nhật sản phẩm | Admin, Manager |
| `/api/sanpham/{id}` | DELETE | Xóa sản phẩm | Admin |

**Product Attributes Example:**
```json
{
  "TenSP": "Smartphone Pro",
  "GiaSP": 15000000,
  "SoLuongTonKho": 50,
  "MaDanhMuc": 1,
  "attributes": {
    "specifications": {
      "screen": "6.1 inch OLED",
      "camera": "48MP + 12MP",
      "storage": "256GB"
    },
    "features": ["5G", "Wireless Charging"],
    "warranty": "24 months"
  }
}
```

### 📦 Order Management

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/orders/` | GET | Danh sách đơn hàng | All |
| `/api/orders/` | POST | Tạo đơn hàng mới | Admin, Manager, Employee |
| `/api/orders/{id}` | GET | Chi tiết đơn hàng | All |
| `/api/orders/{id}` | PUT | Cập nhật đơn hàng | Admin, Manager, Employee |
| `/api/orders/{id}/status` | PUT | Cập nhật trạng thái đơn hàng | Admin, Manager, Employee |
| `/api/orders/{id}/inventory-check` | GET | Kiểm tra tồn kho | Admin, Manager, Employee |

### 🎁 Promotional System

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/promotions/apply` | POST | Áp dụng mã giảm giá | All |
| `/api/promotions/list` | GET | Danh sách voucher | All |
| `/api/promotions/check/{code}` | GET | Kiểm tra voucher | All |

### 📊 Inventory Management

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/inventory/low-stock` | GET | Sản phẩm sắp hết hàng | Admin, Manager |
| `/api/inventory/update-stock` | PUT | Cập nhật tồn kho | Admin, Manager |
| `/api/inventory/check-availability` | GET | Kiểm tra khả dụng | All |

### ⭐ Customer Feedback

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/reviews/` | POST | Tạo đánh giá sản phẩm | Customer |
| `/api/products/{id}/reviews` | GET | Xem đánh giá sản phẩm | All |
| `/api/complaints/` | POST | Gửi khiếu nại | Customer |
| `/api/complaints/` | GET | Danh sách khiếu nại | Admin, Manager |
| `/api/complaints/{id}` | PUT | Phản hồi khiếu nại | Admin, Manager |

### 📈 Reporting & Analytics

| Endpoint | Method | Description | Access |
|----------|--------|-------------|---------|
| `/api/reports/revenue` | GET | Báo cáo doanh thu | Admin, Manager |
| `/api/reports/orders` | GET | Báo cáo đơn hàng | Admin, Manager |
| `/api/reports/best-selling` | GET | Sản phẩm bán chạy | Admin, Manager |
| `/api/reports/low-inventory` | GET | Sản phẩm sắp hết hàng | Admin, Manager |

## 🔧 Cấu hình nâng cao

### CORS Configuration
Đảm bảo CORS được cấu hình đúng trong `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Variables
Tạo file `.env` cho cấu hình:

```env
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/quanlybanhang
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Database Migration
Khi cập nhật schema:

```bash
# Backup database
mysqldump -u root -p quanlybanhang > backup.sql

# Apply new schema
mysql -u root -p quanlybanhang < db/db-ban-do-gia-dung.sql
```

## 🧪 Testing

### API Testing
```bash
# Test authentication
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Test product creation
curl -X POST "http://localhost:8000/api/sanpham/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"TenSP": "Test Product", "GiaSP": 100000, "SoLuongTonKho": 50}'
```

### Frontend Testing
```bash
# Start frontend server
cd frontend
python -m http.server 8080

# Access test interface
open http://localhost:8080/index.html
```

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   export DATABASE_URL="mysql+pymysql://user:pass@host:port/db"
   export SECRET_KEY="production-secret-key"
   ```

2. **Run with Gunicorn**
   ```bash
   pip install gunicorn
   gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 📊 Monitoring & Logging

### Application Logs
```bash
# View logs
tail -f logs/activity.log

# Monitor errors
grep "ERROR" logs/activity.log
```

### Performance Monitoring
- **Database**: Monitor MySQL performance
- **API**: Track response times
- **Memory**: Monitor Python memory usage

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**MinhPhan92** - *Initial work*

## 🙏 Acknowledgments

- FastAPI team for the excellent framework
- SQLAlchemy for robust ORM
- MySQL for reliable database
- All contributors and testers

---

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong `logs/activity.log`
2. Xem API documentation tại `/docs`
3. Tạo issue trên GitHub repository
4. Liên hệ qua email: support@example.com

**Happy Coding! 🚀**
