# Hệ thống Sàn Đấu Giá Real-time BIDPRO

Dự án website đấu giá online với đầy đủ tính năng cho người dùng, người bán và quản trị viên.

## 🚀 Tính năng chính

### User Side (Người dùng)
- ✅ Authentication: Đăng ký, đăng nhập, quên mật khẩu (OTP)
- ✅ Trang chủ với danh sách sản phẩm, filter & sort
- ✅ Chi tiết đấu giá với WebSocket real-time
- ✅ Profile management: Thông tin cá nhân, đổi mật khẩu
- ✅ Watchlist/Favorite: Thêm sản phẩm yêu thích
- ✅ Notifications: Thông báo real-time
- ✅ Wallet: Ví điện tử, nạp/rút tiền
- ✅ Payment: Thanh toán sản phẩm thắng đấu giá

### Seller Side (Người bán)
- ✅ Đăng sản phẩm đấu giá
- ✅ Quản lý sản phẩm của mình
- ✅ Seller statistics

### Admin Side (Quản trị viên)
- ✅ Dashboard với thống kê chi tiết
- ✅ User management: Quản lý người dùng, phân quyền
- ✅ Product management: Quản lý sản phẩm, đóng đấu giá
- ✅ Category management: Quản lý danh mục sản phẩm
- ✅ Banner management: Quản lý banner trang chủ
- ✅ Logs system: Nhật ký hệ thống
- ✅ Transaction management: Phê duyệt giao dịch

## 📁 Cấu trúc dự án

```
D:\Project Python\
├── backend/                    # Backend Python/FastAPI
│   ├── routers/               # API endpoints
│   │   ├── auth.py           # Authentication
│   │   ├── products.py       # Products & Bids
│   │   ├── watchlist.py      # Watchlist
│   │   ├── notifications.py  # Notifications
│   │   ├── wallet.py         # Wallet & Payment
│   │   ├── categories.py     # Categories
│   │   ├── banners.py        # Banners
│   │   └── admin.py          # Admin functions
│   ├── schemas/              # Pydantic models
│   ├── utils/                # Utility functions
│   │   ├── logger.py         # OTP manager
│   │   ├── email_service.py  # Email service
│   │   └── system_logger.py  # System logging
│   ├── models.py             # Database models
│   ├── database.py           # Database connection
│   └── main.py               # FastAPI app
├── frontend/                  # Frontend React
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── WalletPage.jsx
│   │   │   ├── WatchlistPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── AdminCategoriesPage.jsx
│   │   │   ├── AdminBannersPage.jsx
│   │   │   ├── SellerPage.jsx
│   │   │   └── AdminDashboardPage.jsx
│   │   ├── components/       # Reusable components
│   │   │   └── ProductFilters.jsx
│   │   ├── services/         # API services
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   ├── watchlistService.js
│   │   │   ├── notificationService.js
│   │   │   ├── walletService.js
│   │   │   ├── categoryService.js
│   │   │   ├── bannerService.js
│   │   │   └── adminService.js
│   │   ├── contexts/         # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   └── utils/            # Utility functions
│   │       ├── format.js
│   │       ├── validation.js
│   │       └── storage.js
│   └── package.json
└── README.md
```

## 🛠️ Công nghệ sử dụng

### Backend
- **Python 3.x**
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **JWT** - Authentication
- **WebSocket** - Real-time communication
- **bcrypt** - Password hashing

### Frontend
- **React 18**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **JavaScript** - Language

## 📋 Cài đặt và chạy

### Backend Setup

1. **Cài đặt dependencies:**
```bash
cd backend
pip install fastapi uvicorn sqlalchemy python-jose bcrypt python-multipart
```

2. **Kích hoạt virtual environment (Windows):**
```bash
venv\Scripts\activate
```

3. **Chạy backend server:**
```bash
uvicorn main:app --reload
```

Backend sẽ chạy tại: `http://127.0.0.1:8000`

API Documentation: `http://127.0.0.1:8000/docs`

### Frontend Setup

1. **Cài đặt dependencies:**
```bash
cd frontend
npm install
```

2. **Chạy frontend server:**
```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🔐 Tài khoản mặc định

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin (Quản trị viên)

### Seller Account
- **Username:** `seller`
- **Password:** `seller123`
- **Role:** Seller (Người bán)

### Buyer Account
- Đăng ký mới qua form đăng ký
- **Role:** Buyer (Người mua)

## 📝 Database Schema

### Các bảng chính:
- **users** - Người dùng
- **products** - Sản phẩm đấu giá
- **bids** - Lịch sử đấu giá
- **categories** - Danh mục sản phẩm
- **watchlist** - Danh sách yêu thích
- **notifications** - Thông báo
- **wallets** - Ví điện tử
- **transactions** - Lịch sử giao dịch
- **banners** - Banner trang chủ
- **logs** - Nhật ký hệ thống
- **reviews** - Đánh giá sản phẩm
- **reports** - Báo cáo vi phạm

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Thông tin user
- `PUT /api/auth/profile` - Cập nhật profile
- `POST /api/auth/change-password` - Đổi mật khẩu
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Reset mật khẩu
- `POST /api/auth/logout` - Đăng xuất

### Products
- `GET /api/products` - Danh sách sản phẩm (có filter & sort)
- `GET /api/products/{id}` - Chi tiết sản phẩm
- `GET /api/products/{id}/bids` - Lịch sử đấu giá
- `POST /api/products/{id}/bid` - Đặt giá
- `POST /api/products` - Đăng sản phẩm (Seller/Admin)
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm
- `WS /api/products/ws/auction/{id}` - WebSocket real-time

### Watchlist
- `GET /api/watchlist` - Danh sách yêu thích
- `POST /api/watchlist` - Thêm vào yêu thích
- `DELETE /api/watchlist/{id}` - Xóa khỏi yêu thích

### Notifications
- `GET /api/notifications` - Danh sách thông báo
- `GET /api/notifications/unread-count` - Số thông báo chưa đọc
- `PUT /api/notifications/{id}/read` - Đánh dấu đã đọc
- `PUT /api/notifications/mark-all-read` - Đánh dấu tất cả đã đọc
- `DELETE /api/notifications/{id}` - Xóa thông báo

### Wallet
- `GET /api/wallet` - Thông tin ví
- `POST /api/wallet/deposit` - Nạp tiền
- `POST /api/wallet/withdraw` - Rút tiền
- `GET /api/wallet/transactions` - Lịch sử giao dịch
- `POST /api/wallet/payment/{product_id}` - Thanh toán sản phẩm

### Categories
- `GET /api/categories` - Danh sách danh mục
- `POST /api/categories` - Tạo danh mục (Admin)
- `PUT /api/categories/{id}` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/{id}` - Xóa danh mục (Admin)

### Banners
- `GET /api/banners` - Danh sách banner
- `POST /api/banners` - Tạo banner (Admin)
- `PUT /api/banners/{id}` - Cập nhật banner (Admin)
- `DELETE /api/banners/{id}` - Xóa banner (Admin)

### Admin
- `GET /api/admin/stats` - Thống kê hệ thống
- `GET /api/admin/users` - Danh sách người dùng
- `PUT /api/admin/users/{id}/role` - Cập nhật vai trò
- `DELETE /api/admin/users/{id}` - Xóa người dùng
- `GET /api/admin/products` - Danh sách sản phẩm
- `PUT /api/admin/products/{id}/close` - Đóng đấu giá
- `GET /api/admin/logs` - Nhật ký hệ thống
- `GET /api/admin/transactions` - Danh sách giao dịch
- `PUT /api/admin/transactions/{id}/approve` - Phê duyệt giao dịch

## ⚡ Tính nổi bật

1. **Real-time Bidding:** WebSocket cho cập nhật giá và countdown real-time
2. **Anti-Snipe:** Cơ chế gia hạn thời gian khi có bid vào giây cuối
3. **JWT Authentication:** Bảo mật với token-based authentication
4. **Role-based Access:** Phân quyền Admin, Seller, Buyer
5. **OTP Email:** Hệ thống quên mật khẩu với OTP
6. **Wallet System:** Ví điện tử tích hợp
7. **Comprehensive Admin:** Dashboard với thống kê chi tiết
8. **Modern UI:** Giao diện hiện đại với TailwindCSS

## 🎯 Tính năng kế hoạch (Future Enhancements)

- [ ] Chat System giữa buyer và seller
- [ ] Reviews & Ratings system
- [ ] Reports & Complaints system
- [ ] Advanced Anti-snipe algorithms
- [ ] Payment gateway integration (VNPay, MoMo, Stripe)
- [ ] Email notification system thực tế
- [ ] Image upload system
- [ ] Advanced analytics and charts
- [ ] Mobile responsive design improvements
- [ ] Testing suite (Unit tests, E2E tests)

## 👥 Team

- Nguyễn Mai Minh Đạt - 2200000873
- Nguyễn Anh Khoa - 2200004825
- Phạm Nguyễn Nhật Sơn - 2200006700
- Phan Đức Anh - 2200004289

## 📄 License

Dự án này được tạo ra cho mục đích học tập.

---

**Lưu ý:** Đây là phiên bản phát triển (development version). Trước khi triển khai production, cần:
- Thay đổi SECRET_KEY
- Cấu hình SMTP server thực tế cho email
- Sử dụng database production (PostgreSQL/MySQL)
- Thêm HTTPS encryption
- Implement rate limiting
- Add comprehensive error handling
- Security audit