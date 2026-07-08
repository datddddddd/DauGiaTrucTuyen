import os
import sys

# Thêm thư mục hiện tại vào sys.path để import models và database chính xác
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from models import Base

def main():
    print("=== BẮT ĐẦU QUÁ TRÌNH DI CHUYỂN SQLITE SANG POSTGRESQL ===")
    
    # Load file .env
    load_dotenv(os.path.join(current_dir, ".env"))
    
    # 1. Kết nối SQLite nguồn
    sqlite_db_path = os.path.join(current_dir, "auction.db")
    if not os.path.exists(sqlite_db_path):
        print(f"Lỗi: Không tìm thấy file SQLite tại {sqlite_db_path}")
        sys.exit(1)
        
    sqlite_url = f"sqlite:///{sqlite_db_path}"
    print(f"Cơ sở dữ liệu nguồn SQLite: {sqlite_url}")
    sqlite_engine = create_engine(sqlite_url)
    
    # 2. Kết nối PostgreSQL đích từ biến môi trường
    pg_url = os.getenv("DATABASE_URL")
    if not pg_url:
        print("Lỗi: Không tìm thấy biến môi trường 'DATABASE_URL' trong file .env!")
        print("Vui lòng cấu hình DATABASE_URL trong backend/.env trước khi chạy.")
        sys.exit(1)
        
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)
        
    print("Cơ sở dữ liệu đích PostgreSQL được tìm thấy.")
    pg_engine = create_engine(pg_url)
    
    # 3. Tạo tất cả các bảng trên PostgreSQL nếu chưa tồn tại
    print("Đang đồng bộ cấu trúc bảng (schema) sang PostgreSQL...")
    try:
        Base.metadata.create_all(bind=pg_engine)
        print("Đồng bộ cấu trúc bảng thành công.")
    except Exception as e:
        print(f"Lỗi khi tạo bảng trên PostgreSQL: {e}")
        sys.exit(1)
        
    # Định nghĩa thứ tự các bảng dựa theo quan hệ khóa ngoại (Foreign Keys)
    # Các bảng cha đứng trước, bảng con tham chiếu đứng sau
    TABLES_ORDER = [
        "users",
        "categories",
        "banners",
        "wallets",
        "products",
        "bids",
        "watchlist",
        "notifications",
        "transactions",
        "reviews",
        "reports",
        "payments",
        "vnpay_transactions",
        "logs"
    ]
    
    # 4. Làm sạch dữ liệu PostgreSQL đích trước khi di chuyển để tránh trùng khóa chính khi chạy lại
    print("Làm sạch bảng đích PostgreSQL trước khi di chuyển...")
    try:
        with pg_engine.connect() as pg_conn:
            # Xóa theo thứ tự ngược lại để tránh vi phạm khóa ngoại
            for table_name in reversed(TABLES_ORDER):
                table = Base.metadata.tables.get(table_name)
                if table is not None:
                    # Kiểm tra xem bảng có tồn tại trong PostgreSQL không
                    pg_conn.execute(table.delete())
            pg_conn.commit()
        print("Đã dọn dẹp các bảng trên PostgreSQL thành công.")
    except Exception as e:
        print(f"Lỗi khi làm sạch bảng trên PostgreSQL: {e}")
        print("Đảm bảo PostgreSQL đang chạy và tài khoản có quyền ghi/xóa dữ liệu.")
        sys.exit(1)
        
    # 5. Di chuyển dữ liệu từ SQLite sang PostgreSQL
    print("Bắt đầu di chuyển dữ liệu...")
    try:
        for table_name in TABLES_ORDER:
            table = Base.metadata.tables.get(table_name)
            if table is None:
                print(f"Cảnh báo: Bảng '{table_name}' không được định nghĩa trong models.py!")
                continue
                
            # Đọc dữ liệu từ SQLite
            with sqlite_engine.connect() as sqlite_conn:
                results = sqlite_conn.execute(table.select()).fetchall()
                
            if not results:
                print(f"Bảng '{table_name}': Không có dữ liệu ở SQLite. Bỏ qua.")
                continue
                
            # Chuyển đổi dữ liệu sang list dicts
            # Lưu ý: row._asdict() được sử dụng trong SQLAlchemy để chuyển Row sang dict
            data = [row._asdict() for row in results]
            
            # Ghi dữ liệu vào PostgreSQL
            with pg_engine.connect() as pg_conn:
                pg_conn.execute(table.insert(), data)
                pg_conn.commit()
            print(f"Bảng '{table_name}': Đã di chuyển thành công {len(data)} dòng.")
            
    except Exception as e:
        print(f"Lỗi trong quá trình di chuyển dữ liệu của bảng '{table_name}': {e}")
        sys.exit(1)
        
    # 6. Reset các trình tự khóa chính (Primary Key Sequences) trên PostgreSQL
    print("Cập nhật lại giá trị chuỗi (sequences) khóa chính trên PostgreSQL...")
    try:
        with pg_engine.connect() as pg_conn:
            for table_name in TABLES_ORDER:
                table = Base.metadata.tables.get(table_name)
                if table is not None and "id" in table.columns:
                    # Lấy tên sequence tự sinh của PostgreSQL
                    seq_query = text(f"SELECT pg_get_serial_sequence('{table_name}', 'id')")
                    seq_name = pg_conn.execute(seq_query).scalar()
                    
                    if seq_name:
                        # Reset sequence dựa trên ID lớn nhất hiện tại
                        reset_query = text(f"""
                            SELECT setval(
                                '{seq_name}', 
                                COALESCE(MAX(id), 1), 
                                MAX(id) IS NOT NULL
                            ) FROM {table_name}
                        """)
                        pg_conn.execute(reset_query)
            pg_conn.commit()
        print("Cập nhật sequences thành công.")
    except Exception as e:
        print(f"Cảnh báo khi cập nhật khóa chính sequences: {e}")
        
    print("\n=== QUÁ TRÌNH DI CHUYỂN DỮ LIỆU ĐÃ HOÀN THÀNH THÀNH CÔNG ===")

if __name__ == "__main__":
    main()
