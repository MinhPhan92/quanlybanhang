import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚙️ Cấu hình kết nối (sử dụng biến môi trường hoặc giá trị mặc định)
# Có thể tạo file .env trong thư mục backend với nội dung:
# DATABASE_USER=root
# DATABASE_PASSWORD=your_password
# DATABASE_HOST=localhost
# DATABASE_NAME=QuanLyBanHang

# ⚠️ QUAN TRỌNG: Cập nhật mật khẩu MySQL của bạn ở đây hoặc tạo file .env
# Cách 1: Sửa trực tiếp giá trị mặc định bên dưới
# Cách 2: Tạo file .env trong thư mục backend với nội dung:
#         DATABASE_PASSWORD=your_actual_password

DB_USER = os.getenv("DATABASE_USER", os.environ.get("DB_USER", "root"))
DB_PASSWORD = os.getenv("DATABASE_PASSWORD", os.environ.get("DB_PASSWORD", "Phanducminh0902@"))
DB_HOST = os.getenv("DATABASE_HOST", os.environ.get("DB_HOST", "localhost"))
DB_PORT = os.getenv("DATABASE_PORT", os.environ.get("DB_PORT", "3306"))
DB_NAME = os.getenv("DATABASE_NAME", os.environ.get("DB_NAME", "QuanLyBanHang"))

# Nếu có biến DATABASE_URL, dùng trực tiếp; nếu không, build từ các phần còn lại
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
else:
    # Tạo connection string (URL-encode username và password để xử lý ký tự đặc biệt)
    # Quan trọng: Mật khẩu có ký tự đặc biệt như @, :, / cần được encode
    encoded_user = quote_plus(DB_USER)
    encoded_password = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""
    
    if DB_PASSWORD:
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{encoded_user}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    else:
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{encoded_user}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# Tạo engine và session (pool_pre_ping giúp tái kết nối khi MySQL disconnect)
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Dependency để dùng trong các route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
