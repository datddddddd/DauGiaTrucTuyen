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
    load_dotenv(os.path.join(current_dir, ".env"))
    
    sqlite_db_path = os.path.join(current_dir, "auction.db")
    sqlite_engine = create_engine(f"sqlite:///{sqlite_db_path}")
    
    pg_url = os.getenv("DATABASE_URL")
    if not pg_url:
        print("Lỗi: Không tìm thấy biến môi trường 'DATABASE_URL'!")
        sys.exit(1)
        
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql://", 1)
    pg_engine = create_engine(pg_url)
    
    TABLES = [
        "users", "categories", "banners", "products", "wallets", 
        "bids", "watchlist", "notifications", "transactions", 
        "reviews", "reports", "payments", "vnpay_transactions", "logs"
    ]
    
    print("\n--- SO SÁNH SỐ LƯỢNG BẢN GHI GIỮA SQLITE VÀ POSTGRESQL ---")
    print(f"{'Bảng':<20} | {'SQLite':<8} | {'PostgreSQL':<10} | {'Trạng thái':<10}")
    print("-" * 57)
    
    all_ok = True
    for table_name in TABLES:
        try:
            with sqlite_engine.connect() as lite_conn:
                lite_count = lite_conn.execute(text(f"SELECT COUNT(1) FROM {table_name}")).scalar()
        except Exception:
            lite_count = "N/A"
            
        try:
            with pg_engine.connect() as pg_conn:
                pg_count = pg_conn.execute(text(f"SELECT COUNT(1) FROM {table_name}")).scalar()
        except Exception as e:
            pg_count = f"Error: {e}"
            
        if isinstance(lite_count, int) and isinstance(pg_count, int):
            status = "Khớp ✓" if lite_count == pg_count else "LỆCH ✗"
            if lite_count != pg_count:
                all_ok = False
        else:
            status = "Lỗi"
            all_ok = False
            
        print(f"{table_name:<20} | {lite_count:<8} | {pg_count:<10} | {status:<10}")
        
    print("-" * 57)
    if all_ok:
        print(">>> TẤT CẢ CÁC BẢNG ĐÃ KHỚP DỮ LIỆU HOÀN TOÀN! <<<")
    else:
        print(">>> CẢNH BÁO: CÓ SỰ CHÊNH LỆCH DỮ LIỆU HOẶC LỖI TRUY VẤN! <<<")

if __name__ == "__main__":
    main()
