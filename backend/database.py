from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Đường dẫn tự động tạo file database cục bộ ngay trong thư mục backend
SQLALCHEMY_DATABASE_URL = "sqlite:///./auction.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Hàm ra lệnh tự động quét qua models.py để tạo bảng
def init_db():
    Base.metadata.create_all(bind=engine)

# Hàm mượn và trả kết nối dữ liệu cho từng API khi có request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()