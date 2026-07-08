from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Index, Boolean
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

# 1. Bảng Người dùng
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False) 
    role = Column(String, default="buyer")  # buyer, seller, admin
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    is_blocked = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    bids = relationship("Bid", back_populates="user", cascade="all, delete-orphan")
    watchlist_items = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    sold_products = relationship("Product", foreign_keys="Product.seller_id", back_populates="seller")


# 2. Bảng Sản phẩm đấu giá
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    start_price = Column(Integer, nullable=False)       
    step_price = Column(Integer, nullable=False)        
    current_price = Column(Integer, nullable=False)     
    end_time = Column(DateTime, nullable=False)         
    status = Column(String, default="active", index=True) # active, ended
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    images = Column(String, nullable=True)  # JSON string of image URLs
    condition = Column(String, default="new")  # new, used, refurbished
    shipping_code = Column(String, nullable=True)  # Mã vận đơn giao hàng
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    bids = relationship("Bid", back_populates="product", cascade="all, delete-orphan")
    category = relationship("Category", back_populates="products")
    seller = relationship("User", foreign_keys=[seller_id])


# 3. Bảng Lịch sử các lượt Đặt Giá
class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bid_amount = Column(Integer, nullable=False)        
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ giúp JOIN bảng siêu nhanh
    product = relationship("Product", back_populates="bids")
    user = relationship("User", back_populates="bids")

# 4. Bảng Danh mục sản phẩm (Categories)
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    products = relationship("Product", back_populates="category")
    parent = relationship("Category", remote_side=[id], backref="subcategories")


# 5. Bảng Watchlist (Yêu thích)
class Watchlist(Base):
    __tablename__ = "watchlist"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    user = relationship("User", back_populates="watchlist_items")
    product = relationship("Product")


# 6. Bảng Notifications (Thông báo)
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, nullable=False)  # bid_outbid, auction_won, auction_ending, system
    is_read = Column(Boolean, default=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    user = relationship("User", back_populates="notifications")
    product = relationship("Product")


# 7. Bảng Wallet (Ví tiền)
class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Integer, default=0)  # Số dư bằng VNĐ
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Mối quan hệ
    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet", cascade="all, delete-orphan")


# 8. Bảng Transactions (Giao dịch)
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    transaction_type = Column(String, nullable=False)  # deposit, withdraw, payment
    payment_method = Column(String, nullable=True)  # VNPay, MoMo, Stripe
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, completed, failed
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    user = relationship("User")
    wallet = relationship("Wallet", back_populates="transactions")
    product = relationship("Product")


# 9. Bảng Banners (Quản lý banner trang chủ)
class Banner(Base):
    __tablename__ = "banners"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    link_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# 10. Bảng Logs (Nhật ký hệ thống)
class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False, index=True)  # login, logout, bid, admin_action, payment
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    user = relationship("User")


# 11. Bảng Reviews (Đánh giá)
class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Mối quan hệ
    product = relationship("Product")
    user = relationship("User")


# 12. Bảng Reports (Báo cáo vi phạm)
class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    reported_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    report_type = Column(String, nullable=False)  # scam, fake_item, inappropriate, other
    description = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, reviewed, resolved, dismissed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Mối quan hệ
    user = relationship("User", foreign_keys=[user_id])
    product = relationship("Product")
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])


# 13. Bảng Payments (Thanh toán VNPAY)
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    auction_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    transaction_id = Column(String, unique=True, nullable=True, index=True)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="PENDING", index=True)  # PENDING, SUCCESS, FAILED
    payment_method = Column(String, default="VNPAY")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Mối quan hệ
    user = relationship("User")
    product = relationship("Product")
    vnpay_transaction = relationship("VNPTransaction", uselist=False, back_populates="payment", cascade="all, delete-orphan")


# 14. Bảng VNPTransactions (Lưu chi tiết phản hồi từ VNPAY)
class VNPTransaction(Base):
    __tablename__ = "vnpay_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    vnp_transaction_no = Column(String, nullable=True)
    bank_code = Column(String, nullable=True)
    card_type = Column(String, nullable=True)
    response_code = Column(String, nullable=True)
    transaction_date = Column(String, nullable=True)

    # Mối quan hệ
    payment = relationship("Payment", back_populates="vnpay_transaction")


# Tạo Index vật lý trong database giúp tối ưu câu lệnh lấy lịch sử bid
Index("idx_bid_product_amount", Bid.product_id, Bid.bid_amount.desc())