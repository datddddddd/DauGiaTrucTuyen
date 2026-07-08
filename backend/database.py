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
    try:
        conn = engine.raw_connection()
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        if "is_blocked" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT 0")
        if "is_verified" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
            
        cursor.execute("PRAGMA table_info(products)")
        columns_prod = [col[1] for col in cursor.fetchall()]
        if "shipping_code" not in columns_prod:
            cursor.execute("ALTER TABLE products ADD COLUMN shipping_code VARCHAR DEFAULT NULL")
            
        cursor.execute("PRAGMA table_info(transactions)")
        columns_tx = [col[1] for col in cursor.fetchall()]
        if "product_id" not in columns_tx:
            cursor.execute("ALTER TABLE transactions ADD COLUMN product_id INTEGER DEFAULT NULL")
            
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Migration warning: {e}")

# Hàm mượn và trả kết nối dữ liệu cho từng API khi có request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()