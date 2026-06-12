from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from datetime import datetime, timedelta

import threading

import bcrypt



import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import database, models



# Import routers

from routers import auth, products, watchlist, notifications, wallet, categories, banners, admin



app = FastAPI(

    title="Hệ thống Sàn Đấu Giá Real-time Chuyên Nghiệp",

    description="Backend tối ưu bảo mật JWT, Real-time WebSockets và chống Snipe",

    version="2.0.0"

)



# =====================================================================

# 1. CẤU HÌNH CORS CHO FRONTEND REACT KẾT NỐI ỔN ĐỊNH

# =====================================================================

origins = [

    "http://localhost:5173",

    "http://127.0.0.1:5173"

]

app.add_middleware(

    CORSMiddleware,

    allow_origins=origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)



database.init_db()

db_lock = threading.Lock()



# Register routers

app.include_router(auth.router)

app.include_router(products.router)

app.include_router(watchlist.router)

app.include_router(notifications.router)

app.include_router(wallet.router)

app.include_router(categories.router)

app.include_router(banners.router)

app.include_router(admin.router)

# =====================================================================
# TÍCH HỢP WEBSOCKET ĐẤU GIÁ REAL-TIME TRỰC TIẾP VÀO APP GỐC (BƯỚC 2)
# =====================================================================
from routers.products import auction_manager # <-- Import bộ quản lý kết nối từ file products

@app.websocket("/ws/auction/{product_id}")
async def main_auction_websocket(websocket: WebSocket, product_id: str):
    # Chấp nhận và thêm thiết bị vào phòng đấu giá dựa theo ID sản phẩm
    await auction_manager.connect(product_id, websocket)
    try:
        while True:
            # Luôn giữ vòng lặp mở để duy trì trạng thái kết nối (Ping/Pong)
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Tự động xóa thiết bị khỏi phòng khi người dùng ngắt kết nối hoặc đóng tab
        auction_manager.disconnect(product_id, websocket)



# =====================================================================

# 2. TỰ ĐỘNG KHỞI TẠO DỮ LIỆU SẢN PHẨM & TÀI KHOẢN ADMIN MẶC ĐỊNH

# =====================================================================

def seed_data():

    db = next(database.get_db())

    try:

        # Khởi tạo danh mục mẫu

        if db.query(models.Category).count() == 0:

            categories = [

                models.Category(name="Điện tử", description="Điện thoại, máy tính bảng, laptop"),

                models.Category(name="Thời trang", description="Quần áo, giày dép, phụ kiện"),

                models.Category(name="Nhà cửa", description="Đồ gia dụng, nội thất"),

                models.Category(name="Xe cộ", description="Ô tô, xe máy, xe đạp"),

                models.Category(name="Sách", description="Sách, tạp chí, tài liệu"),

            ]

            db.add_all(categories)

            db.commit()

            print("📂 [SEED] Đã tạo danh mục mẫu.")



        # Khởi tạo banner mẫu

        if db.query(models.Banner).count() == 0:

            banners = [

                models.Banner(title="Khuyến mãi đặc biệt", image_url="https://via.placeholder.com/1200x400?text=Khuyến+mãi+đặc+biệt", link_url="/products", order=1, is_active=True),

                models.Banner(title="Sản phẩm mới", image_url="https://via.placeholder.com/1200x400?text=Sản+phẩm+mới", link_url="/products?sort=newest", order=2, is_active=True),

            ]

            db.add_all(banners)

            db.commit()

            print("🎨 [SEED] Đã tạo banner mẫu.")



        # Khởi tạo sản phẩm mẫu

        if db.query(models.Product).count() == 0:

            electronics_cat = db.query(models.Category).filter(models.Category.name == "Điện tử").first()

            db.add(models.Product(

                title="Laptop Gaming Asus ROG Strix",

                description="Core i7, RAM 16GB, RTX 4060",

                category_id=electronics_cat.id if electronics_cat else None,

                start_price=25000000,

                step_price=500000,

                current_price=25000000,

                end_time=datetime.now() + timedelta(hours=2),

                status="active",

                condition="new"

            ))

            db.add(models.Product(

                title="iPhone 15 Pro Max 256GB",

                description="Màu Titan Tự Nhiên, bản quốc tế nguyên seal",

                category_id=electronics_cat.id if electronics_cat else None,

                start_price=29000000,

                step_price=200000,

                current_price=29000000,

                end_time=datetime.now() + timedelta(hours=6),

                status="active",

                condition="new"

            ))

            db.commit()

            print("📦 [SEED] Đã tạo sản phẩm mẫu.")

           

        # KHỞI TẠO TÀI KHOẢN ADMIN MẪU TRONG DATABASE (NẾU CHƯA CÓ)

        admin_exists = db.query(models.User).filter(models.User.username == "admin").first()

        if not admin_exists:

            hashed_pwd = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            admin_user = models.User(

                username="admin",

                email="admin@daugia.com",

                hashed_password=hashed_pwd,

                role="admin",

                full_name="Administrator",

                phone="0123456789"

            )

            db.add(admin_user)

            db.commit()

            db.refresh(admin_user)

           

            # Tạo wallet cho admin

            admin_wallet = models.Wallet(user_id=admin_user.id, balance=100000000)  # 100 triệu VND

            db.add(admin_wallet)

            db.commit()

           

            print("🚀 [SEED] Đã khởi tạo tài khoản Quản Trị Viên:")

            print("   👉 Tài khoản: admin / Mật khẩu: admin123")

       

        # Tạo tài khoản seller mẫu

        seller_exists = db.query(models.User).filter(models.User.username == "seller").first()

        if not seller_exists:

            hashed_pwd = bcrypt.hashpw("seller123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            seller_user = models.User(

                username="seller",

                email="seller@daugia.com",

                hashed_password=hashed_pwd,

                role="seller",

                full_name="Seller Demo",

                phone="0987654321"

            )

            db.add(seller_user)

            db.commit()

            db.refresh(seller_user)

           

            # Tạo wallet cho seller

            seller_wallet = models.Wallet(user_id=seller_user.id, balance=50000000)  # 50 triệu VND

            db.add(seller_wallet)

            db.commit()

           

            print("🏪 [SEED] Đã khởi tạo tài khoản Seller:")

            print("   👉 Tài khoản: seller / Mật khẩu: seller123")



    except Exception as e:

        print(f"Lỗi hệ thống khi chạy seed dữ liệu: {str(e)}")

        import traceback

        traceback.print_exc()  # In chi tiết lỗi để debug

    finally:

        db.close()



# Tạm thời comment out seed_data để debug

# seed_data()