from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚙️ Cấu hình kết nối (sửa theo thông tin MySQL của bạn)
DB_USER = "root"
DB_PASSWORD = "Phanducminh0902%40"  # nếu có mật khẩu thì điền vào
DB_HOST = "localhost"
DB_NAME = "QuanLyBanHang"

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"

# Tạo engine và session
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency để dùng trong các route


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
