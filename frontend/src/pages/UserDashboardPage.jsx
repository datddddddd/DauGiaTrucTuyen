import { useState, useEffect } from "react";
import { useAuth } from "../contexts";
import { formatCurrency, formatNumber } from "../utils";
import { Link } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { watchlistService, notificationService, walletService, productService } from "../services";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const VIETNAM_PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const POPULAR_DISTRICTS = {
  "Hà Nội": [
    "Quận Cầu Giấy", "Quận Ba Đình", "Quận Đống Đa", "Quận Hai Bà Trưng", 
    "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Thanh Xuân", "Quận Hoàng Mai", 
    "Quận Long Biên", "Quận Nam Từ Liêm", "Quận Bắc Từ Liêm", "Quận Hà Đông"
  ],
  "TP. Hồ Chí Minh": [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", 
    "Quận 10", "Quận 11", "Quận 12", "Quận Tân Bình", "Quận Bình Thạnh", 
    "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Phú", "Thành phố Thủ Đức"
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", 
    "Quận Liên Chiểu", "Quận Cẩm Lệ", "Huyện Hòa Vang"
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An", 
    "Quận Kiến An", "Quận Đồ Sơn", "Quận Dương Kinh"
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", 
    "Quận Thốt Nốt"
  ]
};

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [userBids, setUserBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState({ text: "", type: "" });

  // VietQR Dynamic Payment Modal states
  const [selectedOrderForQR, setSelectedOrderForQR] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);

  const listBanks = [
    { id: "vietinbank", name: "VietinBank (TMCP Công thương Việt Nam)" },
    { id: "mbbank", name: "MB Bank (Ngân hàng Quân Đội)" },
    { id: "vietcombank", name: "Vietcombank (TMCP Ngoại Thương Việt Nam)" },
    { id: "techcombank", name: "Techcombank (TMCP Kỹ Thương Việt Nam)" },
    { id: "bidv", name: "BIDV (TMCP Đầu tư và Phát triển Việt Nam)" },
    { id: "acb", name: "ACB (Ngân hàng TMCP Á Châu)" },
  ];
  const [selectedBank, setSelectedBank] = useState({ id: "vietinbank", name: "VietinBank (TMCP Công thương Việt Nam)" });

  const handleBankChange = (bankId) => {
    const bank = listBanks.find(b => b.id === bankId);
    if (bank) {
      setQrLoading(true);
      setSelectedBank(bank);
    }
  };

  // Review states
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Address Warning & Modal states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("");
  const [shippingWard, setShippingWard] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);
  const [isCustomDistrictMode, setIsCustomDistrictMode] = useState(false);
  const { updateProfile } = useAuth();

  useEffect(() => {
    if (user) {
      setShippingName(user.full_name || "");
      setShippingPhone(user.phone || "");
      setShippingEmail(user.email || "");
      
      if (user.address) {
        const parts = user.address.split(" | ");
        if (parts.length >= 3) {
          setShippingWard(parts[0] || "");
          setShippingDistrict(parts[1] || "");
          setShippingCity(parts[2] || "");
          if (parts[3]) {
            setShippingNote(parts[3].replace("Ghi chú: ", "") || "");
          }
        } else if (parts.length === 2) {
          setShippingDistrict(parts[0] || "");
          setShippingCity(parts[1] || "");
        } else {
          setShippingCity(user.address);
        }
      }
    }
  }, [user]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const formattedAddress = `${shippingWard} | ${shippingDistrict} | ${shippingCity}${shippingNote ? ` | Ghi chú: ${shippingNote}` : ""}`;
      
      await updateProfile({
        full_name: shippingName,
        phone: shippingPhone,
        email: shippingEmail,
        address: formattedAddress,
      });
      triggerToast("📍 Đã cập nhật địa chỉ giao hàng thành công!");
      setShowAddressModal(false);
    } catch (error) {
      triggerToast(error.message || "Cập nhật địa chỉ thất bại!", "error");
    }
  };

  // Real states from backend
  const [watchlist, setWatchlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);

  const COLORS = ["#10b981", "#ef4444", "#3b82f6"];

  useEffect(() => {
    if (user) {
      fetchUserData();
      const interval = setInterval(() => {
        fetchUserData(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchWalletData = async () => {
    // Left for wallet references, if any, but let's make sure we keep signature
  };

  const fetchUserData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [watchlistData, notificationsData, bidsData, wonProductsData] = await Promise.all([
        watchlistService.getWatchlist().catch(() => []),
        notificationService.getNotifications().catch(() => []),
        productService.getMyBids().catch(() => []),
        productService.getMyWonProducts().catch(() => []),
      ]);

      const mappedNotifications = notificationsData.map(n => ({
        id: n.id,
        text: `${n.title}: ${n.message}`,
        read: n.is_read,
        date: n.created_at ? new Date(n.created_at).toLocaleDateString("vi-VN") : "Gần đây"
      }));

      const mappedWatchlist = watchlistData.map(w => {
        let timeLeftStr = "Đã kết thúc";
        if (w.end_time) {
          const diff = new Date(w.end_time) - new Date();
          if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            timeLeftStr = `${h}g ${m}p`;
          }
        }
        return {
          id: w.id,
          product_id: w.product_id,
          title: w.product_title,
          current_price: w.current_price,
          timeLeft: timeLeftStr
        };
      });

      const totalSpent = wonProductsData
        .filter(o => o.status !== "Đợi thanh toán")
        .reduce((sum, o) => sum + o.price, 0);

      const statsObj = {
        total_bids: bidsData.length,
        won_auctions: bidsData.filter(b => b.status === "won").length,
        lost_auctions: bidsData.filter(b => b.status === "lost").length,
        active_auctions: bidsData.filter(b => b.status === "active").length,
        total_spent: totalSpent,
        total_saved: totalSpent * 0.15,
        watchlist_count: mappedWatchlist.length,
        notifications_unread: mappedNotifications.filter(n => !n.read).length
      };

      setWatchlist(mappedWatchlist);
      setNotifications(mappedNotifications);
      setOrders(wonProductsData);
      setUserStats(statsObj);
      
      const mappedBids = bidsData.map(b => ({
        product_id: b.product_id,
        product_name: b.product_name,
        amount: b.amount,
        status: b.status,
        date: b.date ? new Date(b.date).toLocaleDateString("vi-VN") : "Gần đây"
      }));
      setUserBids(mappedBids);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3000);
  };

  // 2.6 Watchlist Management
  const removeFromWatchlist = async (id) => {
    try {
      await watchlistService.removeFromWatchlist(id);
      triggerToast("🗑️ Đã xóa sản phẩm khỏi danh sách theo dõi");
      fetchUserData();
    } catch (error) {
      triggerToast("Bỏ theo dõi thất bại: " + error.message, "error");
    }
  };

  // 2.7 Read Notification
  const markNotificationAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      triggerToast("✓ Đã đánh dấu đọc thông báo");
      fetchUserData();
    } catch (error) {
      triggerToast("Thao tác thất bại: " + error.message, "error");
    }
  };

  // 2.8 Order Payment
  const payOrder = async (orderId, method) => {
    try {
      if (method === "Chuyển khoản VietQR") {
        await walletService.payForAuction(orderId, "VietQR");
        triggerToast("💳 Đã gửi thông báo xác nhận chuyển khoản. Vui lòng chờ Admin duyệt!");
        setSelectedOrderForQR(null);
      } else {
        await walletService.payForAuction(orderId, "wallet");
        triggerToast(`💳 Đã thanh toán đơn hàng bằng ví ký quỹ thành công!`);
      }
      fetchUserData();
    } catch (error) {
      triggerToast("Thanh toán thất bại: " + (error.response?.data?.detail || error.message), "error");
    }
  };

  const handlePayVNPAY = async (order) => {
    try {
      triggerToast("⏳ Đang kết nối tới VNPAY...", "loading");
      const response = await walletService.createVNPAYPayment(order.id, user.id, order.price);
      if (response && response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        triggerToast("Không nhận được URL thanh toán từ hệ thống!", "error");
      }
    } catch (error) {
      triggerToast("Khởi tạo thanh toán VNPAY thất bại: " + (error.response?.data?.detail || error.message), "error");
    }
  };

  // 2.9 Delivery Confirmation
  const confirmDeliveryReceived = async (orderId) => {
    try {
      await productService.updateProductStatus(orderId, "delivered");
      triggerToast("📦 Xác nhận đã nhận hàng thành công! Đang chờ giải ngân.");
      fetchUserData();
    } catch (error) {
      triggerToast("Thao tác thất bại: " + (error.response?.data?.detail || error.message), "error");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const API_URL = import.meta.env.VITE_API_URL || "https://dau-gia-api.onrender.com/api";
      const response = await fetch(`${API_URL}/products/${reviewProduct.id}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      
      if (response.ok) {
        triggerToast("⭐ Gửi đánh giá người bán thành công!");
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewComment("");
        fetchUserData();
      } else {
        const data = await response.json();
        triggerToast("Lỗi gửi đánh giá: " + (data.detail || "Không rõ"), "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Lỗi kết nối", "error");
    }
  };

  // 2.8 Bank Transfer VietQR trigger
  const handleOpenQRModal = (order) => {
    // Integrity check (§14): Only allow generating QR code if order status is still "Đợi thanh toán"
    if (order.status !== "ended" && order.status !== "Đợi thanh toán") {
      alert("⚠️ Lỗi toàn vẹn: Đơn hàng đã được thanh toán hoặc không ở trạng thái chờ!");
      return;
    }
    setQrLoading(true);
    setSelectedOrderForQR(order);
  };

  // Copy helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    triggerToast(`📋 Đã sao chép ${label}: ${text}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] dark:bg-[#0b0f14] p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-slate-500">Vui lòng đăng nhập để xem Dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5f0] dark:bg-[#0b0f14] p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-slate-500">Đang tải dữ liệu khách hàng...</p>
        </div>
      </div>
    );
  }

  const bidStatusData = [
    { name: "Thắng", value: userStats?.won_auctions || 0 },
    { name: "Thua", value: userStats?.lost_auctions || 0 },
    { name: "Đang đấu giá", value: userStats?.active_auctions || 0 },
  ];

  const spendingData = [
    { name: "Chi tiêu", value: userStats?.total_spent || 0 },
    { name: "Đã tiết kiệm", value: userStats?.total_saved || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#f6f5f0] dark:bg-[#0b0f14] p-4 md:p-6 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              👤 CLIENT PORTAL
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Khách hàng: <span className="text-slate-900 dark:text-white font-bold">{user.username}</span> | Quản lý ví tiền, đặt thầu và thanh toán.
            </p>
          </div>
          <div className="px-2.5 py-1 text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900 rounded-full uppercase tracking-wider">
            🟢 CLIENT PORTAL ACTIVE
          </div>
        </div>

        {/* Toast Alert */}
        {toast.text && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900 text-xs font-bold text-center">
            {toast.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">🏆 Thắng đấu giá</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{formatNumber(userStats?.won_auctions || 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-xl text-emerald-600 dark:text-emerald-450">🏆</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">❌ Thua đấu giá</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{formatNumber(userStats?.lost_auctions || 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-xl text-red-650 dark:text-red-400">❌</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">🔥 Đang đấu giá</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{formatNumber(userStats?.active_auctions || 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-xl text-blue-600 dark:text-blue-450">🔥</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm transform hover:scale-[1.01] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">💰 Tổng chi tiêu</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(userStats?.total_spent || 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-xl text-violet-600 dark:text-violet-455">💰</div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold">
          {[
            { id: "overview", label: "📊 Tổng quan" },
            { id: "bids", label: "💰 Lịch sử đặt giá (2.5)" },
            { id: "watchlist", label: "⭐ Theo theo dõi (2.6)" },
            { id: "notifications", label: "🔔 Thông báo (2.7)" },
            { id: "orders", label: "📦 Thanh toán & Giao hàng (2.8/2.9)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === tab.id
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow"
                  : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content panels */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">Tỷ lệ thắng thầu</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={bidStatusData} 
                        cx="50%" 
                        cy="50%" 
                        labelLine={false} 
                        label={({name, value, percent}) => value > 0 ? `${name} (${(percent*100).toFixed(0)}%)` : ""} 
                        outerRadius={80}
                      >
                        {bidStatusData.map((e, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-around mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: "#10b981" }}></span>
                  <span>Thắng: {userStats?.won_auctions || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: "#ef4444" }}></span>
                  <span>Thua: {userStats?.lost_auctions || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: "#3b82f6" }}></span>
                  <span>Đang đấu: {userStats?.active_auctions || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">Chi tiêu so với tiết kiệm</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => v >= 1000000 ? (v * 0.000001).toLocaleString("vi-VN") + " Tr" : v.toLocaleString("vi-VN")} width={80} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bids" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">💰 Danh sách các phiên đấu giá đã tham gia</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="p-3">Tên sản phẩm</th>
                    <th className="p-3">Số tiền đặt giá</th>
                    <th className="p-3">Trạng thái thắng/thua</th>
                    <th className="p-3">Ngày đấu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {userBids.map((bid, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                      <td className="p-3 text-slate-900 dark:text-white font-bold">{bid.product_name}</td>
                      <td className="p-3 text-indigo-500 font-semibold">{formatCurrency(bid.amount)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          bid.status === "won"
                            ? "bg-green-150/15 text-green-500"
                            : bid.status === "lost"
                            ? "bg-red-150/15 text-red-500"
                            : "bg-blue-150/15 text-blue-500"
                        }`}>
                          {bid.status === "won" ? "Thắng thầu" : bid.status === "lost" ? "Thua thầu" : "Đang đấu"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-450">{bid.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "watchlist" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">⭐ Danh mục các sản phẩm đang quan tâm</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchlist.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
                  <div className="space-y-1 text-xs">
                    <Link to={`/auction/${item.product_id}`} className="hover:underline">
                      <h4 className="font-bold text-slate-900 dark:text-white hover:text-violet-600 transition">
                        {item.title}
                      </h4>
                    </Link>
                    <p className="text-slate-500">Giá hiện tại: <span className="text-red-500 font-bold">{formatCurrency(item.current_price)}</span></p>
                    <p className="text-[10px] text-slate-400">⏳ Thời gian còn lại: {item.timeLeft}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      to={`/auction/${item.product_id}`}
                      className="px-2.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-lg text-[10px] font-bold transition inline-block text-center"
                    >
                      Đấu giá
                    </Link>
                    <button
                      onClick={() => removeFromWatchlist(item.id)}
                      className="px-2.5 py-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg text-[10px]"
                    >
                      Bỏ theo dõi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">🔔 Thông báo trạng thái thầu</h3>
            
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border flex justify-between items-center gap-4 transition text-xs font-medium ${
                    n.read
                      ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-150 dark:border-slate-800 text-slate-400"
                      : "bg-amber-50/20 border-amber-500/20 dark:bg-amber-950/10 text-slate-900 dark:text-white"
                  }`}
                >
                  <div className="space-y-1">
                    <p className={n.read ? "opacity-80" : "font-bold"}>{n.text}</p>
                    <span className="text-[9px] text-slate-455">{n.date}</span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markNotificationAsRead(n.id)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:text-slate-900 text-white rounded-lg text-[9px] font-bold"
                    >
                      Đánh dấu đọc
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">📦 Thanh toán đơn hàng & Theo dõi giao nhận</h3>

            {orders.some(o => ["confirmed", "preparing", "shipping", "completed", "delivered"].includes(o.status)) && (!user?.phone || !user?.address) && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-semibold animate-pulse">
                <div className="space-y-1">
                  <p className="text-red-800 dark:text-red-400 font-black uppercase tracking-wider">🚨 THIẾU THÔNG TIN GIAO HÀNG (GIỐNG SHOPEE)</p>
                  <p className="text-slate-650 dark:text-slate-350">
                    Đơn hàng của bạn đã được xác nhận thanh toán! Vui lòng bổ sung **Số điện thoại** và **Địa chỉ nhận hàng** để Người bán có thể đóng gói và chuyển phát hàng hóa cho bạn.
                  </p>
                </div>
                 <button
                  onClick={() => {
                    setShippingName(user?.full_name || "");
                    setShippingPhone(user?.phone || "");
                    setShippingEmail(user?.email || "");
                    setShowAddressModal(true);
                  }}
                  className="px-3.5 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-[10px] whitespace-nowrap shadow-md"
                >
                  Cập nhật ngay
                </button>
              </div>
            )}

            <div className="space-y-4">
              {(() => {
                const orderStatusMap = {
                  ended: { text: "Chờ thanh toán", bg: "bg-amber-100 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400" },
                  wait_confirm: { text: "Chờ Admin duyệt VietQR", bg: "bg-blue-100 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400" },
                  confirmed: { text: "Đã thanh toán", bg: "bg-teal-100 dark:bg-teal-955/20 text-teal-600 dark:text-teal-400" },
                  preparing: { text: "Đang chuẩn bị hàng", bg: "bg-emerald-100 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400" },
                  shipping: { text: "Đang giao hàng", bg: "bg-indigo-100 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-450" },
                  delivered: { text: "Đã giao hàng / Chờ giải ngân", bg: "bg-orange-100 dark:bg-orange-955/20 text-orange-600 dark:text-orange-400" },
                  completed: { text: "Giao dịch hoàn tất", bg: "bg-green-100 dark:bg-green-955/20 text-green-600 dark:text-green-400" },
                  "Đợi thanh toán": { text: "Chờ thanh toán", bg: "bg-amber-100 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400" },
                  "Đang vận chuyển": { text: "Đang giao hàng", bg: "bg-indigo-100 dark:bg-indigo-955/20 text-indigo-600 dark:text-indigo-450" },
                  "Đã giao hàng": { text: "Đã giao hàng / Chờ giải ngân", bg: "bg-orange-100 dark:bg-orange-955/20 text-orange-600 dark:text-orange-400" },
                };

                return orders.map((o) => {
                  const statusInfo = orderStatusMap[o.status] || { text: o.status, bg: "bg-slate-150 dark:bg-slate-800 text-slate-500" };
                  return (
                    <div key={o.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{o.title}</h4>
                          <p className="text-[10px] text-slate-400">Mã đơn hàng #{o.id} | Ngày thắng giải: {o.date}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase self-start sm:self-center ${statusInfo.bg}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <p className="text-slate-500">Tổng tiền trúng đấu: <strong className="text-red-500 text-sm">{formatCurrency(o.price)}</strong></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Phương thức: {o.paymentMethod || "Ký quỹ qua hệ thống"}</p>
                        </div>
                        
                        {(o.status === "ended" || o.status === "Đợi thanh toán") && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => payOrder(o.id, "Ví ký quỹ (Escrow)")}
                              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-slate-950 font-black rounded-lg text-[10px] text-white"
                            >
                              Ví ký quỹ
                            </button>
                            <button
                              onClick={() => handleOpenQRModal(o)}
                              className="px-3.5 py-2 border border-slate-350 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-800 dark:text-white"
                            >
                              Chuyển khoản VietQR
                            </button>
                            <button
                              onClick={() => handlePayVNPAY(o)}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px]"
                            >
                              Thanh toán VNPAY
                            </button>
                          </div>
                        )}

                        {o.status === "wait_confirm" && (
                          <span className="text-blue-500 font-bold text-[10px]">🔄 Chờ xác thực thanh toán VietQR...</span>
                        )}

                        {o.status === "confirmed" && (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-emerald-500 font-bold text-[10px]">📦 Đã thanh toán! Đang chờ Người bán chuẩn bị hàng...</span>
                            {(!user?.phone || !user?.address) && (
                              <span className="text-red-500 font-bold text-[9px] bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                                ⚠️ Vui lòng cập nhật địa chỉ để giao hàng
                              </span>
                            )}
                          </div>
                        )}

                        {o.status === "preparing" && (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-emerald-500 font-bold text-[10px]">📦 Người bán đang soạn hàng...</span>
                            {(!user?.phone || !user?.address) && (
                              <span className="text-red-500 font-bold text-[9px] bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
                                ⚠️ Vui lòng cập nhật địa chỉ để giao hàng
                              </span>
                            )}
                          </div>
                        )}

                        {(o.status === "shipping" || o.status === "Đang vận chuyển") && (
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-indigo-500 font-bold text-[10px] mb-1">🚚 Đang vận chuyển (Mã vận đơn: {o.shipping_code || "Chưa cập nhật"})</span>
                            <button
                              onClick={() => confirmDeliveryReceived(o.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]"
                            >
                              Đã nhận được hàng
                            </button>
                          </div>
                        )}

                        {(o.status === "delivered" || o.status === "Đã giao hàng") && (
                          <div className="flex gap-2 items-center">
                            <span className="text-orange-500 font-bold text-[10px] mr-2">⏳ Đã giao hàng / Chờ giải ngân</span>
                          </div>
                        )}

                        {o.status === "completed" && (
                          <div className="flex gap-2 items-center">
                            <span className="text-green-500 font-bold text-[10px] mr-2">✅ Giao dịch hoàn tất</span>
                            <button
                              onClick={() => {
                                setReviewProduct(o);
                                setShowReviewModal(true);
                              }}
                              className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px]"
                            >
                              Đánh giá người bán ⭐
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* VietQR Dynamic Payment Modal (Escrow Bank Transfer) */}
        {selectedOrderForQR && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
              
              {/* Left Column: QR Code Display with Skeleton loader */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-850 shrink-0 w-full md:w-72">
                <div className="relative w-56 h-72 flex items-center justify-center bg-white rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 p-2">
                  {qrLoading && (
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 animate-pulse flex flex-col items-center justify-center text-[10px] text-slate-400 font-bold gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                      <span>Tạo mã VietQR...</span>
                    </div>
                  )}
                  <img
                    src={`https://img.vietqr.io/image/${selectedBank.id}-0835332997-compact2.png?amount=${selectedOrderForQR.price}&addInfo=${encodeURIComponent("BIDPRO PAY " + selectedOrderForQR.id)}&accountName=NGUYEN%20MAI%20MINH%20DAT`}
                    alt="VietQR Chuyển khoản"
                    onLoad={() => setQrLoading(false)}
                    className={`w-full h-auto object-contain transition-opacity duration-300 ${qrLoading ? "opacity-0" : "opacity-100"}`}
                  />
                </div>
                <span className="text-[9px] text-slate-400 mt-3 font-medium text-center">Quét mã bằng ứng dụng ngân hàng của bạn</span>
              </div>

              {/* Right Column: Copyable Account Fields */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Thông Tin Chuyển Khoản</h3>
                    <span className="text-[10px] bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded font-bold">Đợi thanh toán</span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[9px] text-slate-400 uppercase font-black mb-1">Chọn ngân hàng thụ hưởng</label>
                    <select
                      value={selectedBank.id}
                      onChange={(e) => handleBankChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-250 focus:outline-none focus:border-indigo-500 font-bold"
                    >
                      {listBanks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 text-xs font-semibold text-slate-500">
                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Ngân hàng thụ hưởng</span>
                        <span className="text-slate-850 dark:text-slate-200">{selectedBank.name}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Số tài khoản</span>
                        <span className="text-slate-850 dark:text-slate-200 font-mono text-sm">0835332997</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard("0835332997", "Số tài khoản")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Chủ tài khoản</span>
                        <span className="text-slate-850 dark:text-slate-200">NGUYEN MAI MINH DAT</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard("NGUYEN MAI MINH DAT", "Chủ tài khoản")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Số tiền chuyển</span>
                        <span className="text-red-500 font-bold text-sm">{formatCurrency(selectedOrderForQR.price)}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedOrderForQR.price.toString(), "Số tiền")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Nội dung chuyển khoản</span>
                        <span className="text-slate-850 dark:text-slate-200 font-mono text-sm font-black">BIDPRO PAY {selectedOrderForQR.id}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`BIDPRO PAY ${selectedOrderForQR.id}`, "Nội dung chuyển khoản")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      payOrder(selectedOrderForQR.id, "Chuyển khoản VietQR");
                      setSelectedOrderForQR(null);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Đã chuyển khoản xong ✓
                  </button>
                  <button
                    onClick={() => setSelectedOrderForQR(null)}
                    className="px-4 py-2.5 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-500"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && reviewProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-800 dark:text-white">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">⭐ Đánh giá người bán</h3>
              <p className="text-xs text-slate-500">Sản phẩm: <strong>{reviewProduct.title}</strong></p>
              
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Số sao đánh giá</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-slate-250 focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5 Xuất sắc)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5 Tốt)</option>
                    <option value={3}>⭐⭐⭐ (3/5 Bình thường)</option>
                    <option value={2}>⭐⭐ (2/5 Tệ)</option>
                    <option value={1}>⭐ (1/5 Rất tệ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Bình luận chi tiết</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Viết nhận xét của bạn về người bán, sản phẩm và tốc độ giao hàng..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition animate-pulse-subtle"
                  >
                    Gửi nhận xét
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewProduct(null);
                    }}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-500"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Address Update Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs text-slate-800 dark:text-white">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">📍 Thiết lập thông tin nhận hàng</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveAddress} className="p-5 space-y-3.5 font-semibold">
                <div>
                  <label className="block text-[9px] text-slate-450 uppercase font-black mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-455 uppercase font-black mb-1">Số điện thoại *</label>
                    <input
                      type="text"
                      required
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      placeholder="Số điện thoại liên hệ..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-455 uppercase font-black mb-1">Gmail *</label>
                    <input
                      type="email"
                      required
                      value={shippingEmail}
                      onChange={(e) => setShippingEmail(e.target.value)}
                      placeholder="Địa chỉ email liên hệ..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-455 uppercase font-black mb-1">Tỉnh / Thành phố *</label>
                    <select
                      required
                      value={shippingCity}
                      onChange={(e) => {
                        setShippingCity(e.target.value);
                        setShippingDistrict("");
                        setShippingWard("");
                        setIsCustomDistrictMode(false);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2.5 text-slate-850 dark:text-slate-250 focus:outline-none focus:border-indigo-500 font-bold text-[11px]"
                    >
                      <option value="">-- Chọn --</option>
                      {VIETNAM_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-455 uppercase font-black mb-1">Quận / Huyện *</label>
                    {POPULAR_DISTRICTS[shippingCity] && !isCustomDistrictMode ? (
                      <select
                        required
                        value={shippingDistrict}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setIsCustomDistrictMode(true);
                            setShippingDistrict("");
                          } else {
                            setShippingDistrict(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2.5 text-slate-850 dark:text-slate-250 focus:outline-none focus:border-indigo-500 font-bold text-[11px]"
                      >
                        <option value="">-- Chọn --</option>
                        {POPULAR_DISTRICTS[shippingCity].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                        <option value="custom">✍️ Khác...</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={shippingDistrict}
                          onChange={(e) => setShippingDistrict(e.target.value)}
                          placeholder="Quận / Huyện..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2.5 text-slate-850 dark:text-slate-250 focus:outline-none focus:border-indigo-500 font-bold text-[11px]"
                        />
                        {POPULAR_DISTRICTS[shippingCity] && (
                          <button
                            type="button"
                            onClick={() => setIsCustomDistrictMode(false)}
                            className="absolute right-2 top-2.5 text-[8px] text-indigo-550 hover:underline font-bold"
                          >
                            List
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-455 uppercase font-black mb-1">Phường / Xã *</label>
                    <input
                      type="text"
                      required
                      value={shippingWard}
                      onChange={(e) => setShippingWard(e.target.value)}
                      placeholder="Phường / Xã..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2.5 text-slate-850 dark:text-slate-250 focus:outline-none focus:border-indigo-500 font-bold text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-455 uppercase font-black mb-1">Ghi chú giao nhận</label>
                  <textarea
                    value={shippingNote}
                    onChange={(e) => setShippingNote(e.target.value)}
                    rows="2.5"
                    placeholder="Lưu ý khi giao hàng (ví dụ: giao giờ hành chính)..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 py-1 select-none">
                  <input
                    type="checkbox"
                    id="isDefaultAddress"
                    checked={isDefaultAddress}
                    onChange={(e) => setIsDefaultAddress(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-350 text-indigo-650 focus:ring-indigo-500"
                  />
                  <label htmlFor="isDefaultAddress" className="text-[10px] text-slate-500 dark:text-slate-400 font-black cursor-pointer">
                    Đặt làm địa chỉ đầy đủ
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Lưu địa chỉ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2.5 border border-slate-350 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-500"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboardPage;