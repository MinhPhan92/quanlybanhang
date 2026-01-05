import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚙️ Cấu hình kết nối — ưu tiên lấy từ biến môi trường (an toàn để deploy / local)
# Bạn có thể set các biến: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME hoặc DATABASE_URL
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "1234")
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "3306")
DB_NAME = os.environ.get("DB_NAME", "QuanLyBanHang")

# Nếu có biến DATABASE_URL, dùng trực tiếp; nếu không, build từ các phần còn lại
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4",
)

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
