from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from fastapi.middleware.cors import CORSMiddleware

from datetime import datetime, timedelta

import threading

import bcrypt

import asyncio
from fastapi.staticfiles import StaticFiles


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

app.mount("/static", StaticFiles(directory="static"), name="static")

# =====================================================================

# 1. CẤU HÌNH CORS CHO FRONTEND REACT KẾT NỐI ỔN ĐỊNH

# =====================================================================

origins = [

    "http://localhost:5173",

    "http://127.0.0.1:5173"

]

app.add_middleware(

    CORSMiddleware,

    allow_origins=["http://localhost:5173"],

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
# LUỒNG WORKER TỰ ĐỘNG QUÉT & ĐÓNG PHIÊN ĐẤU GIÁ KHI HẾT GIỜ (REAL-TIME)
# =====================================================================
async def check_expired_auctions_worker():
    while True:
        await asyncio.sleep(5)  # Quét mỗi 5 giây
        db = next(database.get_db())
        try:
            now = datetime.utcnow()
            # Tìm các sản phẩm đang 'active' nhưng đã quá giờ kết thúc
            expired_products = db.query(models.Product).filter(
                models.Product.status == "active",
                models.Product.end_time <= now
            ).all()

            for product in expired_products:
                # Đóng trạng thái sản phẩm
                product.status = "ended"
                db.commit()

                # Lấy lượt đấu giá cao nhất của sản phẩm
                highest_bid = db.query(models.Bid).filter(
                    models.Bid.product_id == product.id
                ).order_by(models.Bid.bid_amount.desc()).first()

                if highest_bid:
                    winner = db.query(models.User).filter(models.User.id == highest_bid.user_id).first()
                    seller = db.query(models.User).filter(models.User.id == product.seller_id).first() if product.seller_id else None

                    # Cập nhật ví tiền người thắng (trừ tiền)
                    winner_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == winner.id).first()
                    if not winner_wallet:
                        winner_wallet = models.Wallet(user_id=winner.id, balance=0)
                        db.add(winner_wallet)
                        db.commit()
                        db.refresh(winner_wallet)

                    winner_wallet.balance -= highest_bid.bid_amount
                    winner_wallet.updated_at = datetime.utcnow()

                    # Cập nhật ví tiền người bán (cộng tiền)
                    seller_wallet = None
                    if seller:
                        seller_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == seller.id).first()
                        if not seller_wallet:
                            seller_wallet = models.Wallet(user_id=seller.id, balance=0)
                            db.add(seller_wallet)
                            db.commit()
                            db.refresh(seller_wallet)
                        
                        seller_wallet.balance += highest_bid.bid_amount
                        seller_wallet.updated_at = datetime.utcnow()

                    # Ghi nhận lịch sử giao dịch (Transaction Logs)
                    winner_transaction = models.Transaction(
                        user_id=winner.id,
                        wallet_id=winner_wallet.id,
                        amount=-highest_bid.bid_amount,
                        transaction_type="payment",
                        description=f"Thanh toán thắng đấu giá sản phẩm: {product.title}",
                        status="completed"
                    )
                    db.add(winner_transaction)

                    if seller and seller_wallet:
                        seller_transaction = models.Transaction(
                            user_id=seller.id,
                            wallet_id=seller_wallet.id,
                            amount=highest_bid.bid_amount,
                            transaction_type="payment",
                            description=f"Nhận tiền bán sản phẩm đấu giá: {product.title}",
                            status="completed"
                        )
                        db.add(seller_transaction)

                    # Gửi thông báo hệ thống (Notifications)
                    winner_notification = models.Notification(
                        user_id=winner.id,
                        title="🎉 Bạn đã thắng một phiên đấu giá!",
                        message=f"Chúc mừng! Bạn đã thắng sản phẩm '{product.title}' với giá {highest_bid.bid_amount:,} VNĐ. Số dư ví đã tự động được thanh toán.",
                        notification_type="auction_won",
                        product_id=product.id,
                        is_read=False
                    )
                    db.add(winner_notification)

                    if seller:
                        seller_notification = models.Notification(
                            user_id=seller.id,
                            title="💰 Sản phẩm của bạn đã bán thành công!",
                            message=f"Sản phẩm '{product.title}' đã kết thúc đấu giá thành công! Người mua '{winner.username}' đã thanh toán {highest_bid.bid_amount:,} VNĐ.",
                            notification_type="system",
                            product_id=product.id,
                            is_read=False
                        )
                        db.add(seller_notification)

                    db.commit()

                    # Gửi tín hiệu WebSocket để cập nhật trực tiếp màn hình người dùng
                    await auction_manager.broadcast(str(product.id), {
                        "event": "auction_ended",
                        "product_id": product.id,
                        "title": product.title,
                        "status": "ended",
                        "winner_username": winner.username,
                        "final_price": highest_bid.bid_amount
                    })
                else:
                    # Kết thúc nhưng không có ai đặt giá
                    if product.seller_id:
                        seller_notification = models.Notification(
                            user_id=product.seller_id,
                            title="⏳ Sản phẩm của bạn đã hết hạn đấu giá",
                            message=f"Phiên đấu giá sản phẩm '{product.title}' đã kết thúc nhưng rất tiếc không có lượt đặt giá nào.",
                            notification_type="system",
                            product_id=product.id,
                            is_read=False
                        )
                        db.add(seller_notification)
                        db.commit()

                    # Gửi tín hiệu kết thúc không người thắng qua WebSocket
                    await auction_manager.broadcast(str(product.id), {
                        "event": "auction_ended",
                        "product_id": product.id,
                        "title": product.title,
                        "status": "ended",
                        "winner_username": None,
                        "final_price": product.start_price
                    })

        except Exception as e:
            print(f"❌ [WORKER ERROR] Lỗi khi đóng đấu giá: {str(e)}")
            db.rollback()
        finally:
            db.close()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(check_expired_auctions_worker())

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