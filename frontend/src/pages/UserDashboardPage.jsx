import { useState, useEffect } from "react";
import { useAuth } from "../contexts";
import { formatCurrency, formatNumber } from "../utils";

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

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [userBids, setUserBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Simulate data for now (you can replace with real API calls)
      const mockStats = {
        total_bids: 45,
        won_auctions: 8,
        lost_auctions: 12,
        active_auctions: 3,
        total_spent: 15000000,
        total_saved: 25000000,
        watchlist_count: 15,
        notifications_unread: 5,
      };

      const mockBids = [
        { product_id: 1, product_name: "iPhone 15 Pro Max", amount: 32000000, status: "won", date: "2024-01-15" },
        { product_id: 2, product_name: "MacBook Pro M3", amount: 45000000, status: "lost", date: "2024-01-14" },
        { product_id: 3, product_name: "Samsung Galaxy S24", amount: 28000000, status: "active", date: "2024-01-13" },
        { product_id: 4, product_name: "Sony WH-1000XM5", amount: 8500000, status: "won", date: "2024-01-12" },
        { product_id: 5, product_name: "iPad Pro 12.9", amount: 35000000, status: "lost", date: "2024-01-11" },
      ];

      setUserStats(mockStats);
      setUserBids(mockBids);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-page-bg p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-brand-text">Vui lòng đăng nhập để xem Dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page-bg p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-brand-text">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Data for charts
  const bidStatusData = [
    { name: "Thắng", value: userStats?.won_auctions || 0 },
    { name: "Thua", value: userStats?.lost_auctions || 0 },
    { name: "Đang đấu giá", value: userStats?.active_auctions || 0 },
  ];

  const spendingData = [
    { name: "Chi tiêu", value: userStats?.total_spent || 0 },
    { name: "Đã tiết kiệm", value: userStats?.total_saved || 0 },
  ];

  const bidActivityData = [
    { name: "Thứ 2", bids: 5 },
    { name: "Thứ 3", bids: 8 },
    { name: "Thứ 4", bids: 12 },
    { name: "Thứ 5", bids: 7 },
    { name: "Thứ 6", bids: 9 },
    { name: "Thứ 7", bids: 15 },
    { name: "CN", bids: 3 },
  ];

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-h mb-2">
            👤 Dashboard Cá Nhân
          </h1>
          <p className="text-brand-text text-lg">
            Chào mừng, {user.username}! Tổng quan hoạt động của bạn.
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl">
                {user.role === "admin" ? "🎛️" : user.role === "seller" ? "🏪" : "👤"}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="opacity-90">{user.email}</p>
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mt-1">
                  {user.role === "admin" ? "Quản Trị Viên" : user.role === "seller" ? "Người Bán" : "Người Mua"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Ngày tham gia</p>
              <p className="text-xl font-bold">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">🏆 Thắng đấu giá</p>
                <p className="text-4xl font-bold">{formatNumber(userStats?.won_auctions || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">🏆</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">❌ Thua đấu giá</p>
                <p className="text-4xl font-bold">{formatNumber(userStats?.lost_auctions || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">❌</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">🔥 Đang đấu giá</p>
                <p className="text-4xl font-bold">{formatNumber(userStats?.active_auctions || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">🔥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">💰 Tổng chi tiêu</p>
                <p className="text-2xl font-bold">{formatCurrency(userStats?.total_spent || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">💰</div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-brand-border rounded-xl p-5 bg-brand-bg">
            <p className="text-sm text-brand-text mb-2">📊 Tỷ lệ thắng</p>
            <p className="text-2xl font-bold text-green-600">
              {userStats?.total_bids > 0 ? Math.round(((userStats?.won_auctions || 0) / userStats?.total_bids) * 100) : 0}%
            </p>
          </div>
          <div className="border border-brand-border rounded-xl p-5 bg-brand-bg">
            <p className="text-sm text-brand-text mb-2">⭐ Yêu thích</p>
            <p className="text-2xl font-bold text-accent">{formatNumber(userStats?.watchlist_count || 0)}</p>
          </div>
          <div className="border border-brand-border rounded-xl p-5 bg-brand-bg">
            <p className="text-sm text-brand-text mb-2">🔔 Thông báo</p>
            <p className="text-2xl font-bold text-orange-600">{formatNumber(userStats?.notifications_unread || 0)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-brand-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "overview"
                ? "text-accent border-b-2 border-accent bg-accent/10"
                : "text-brand-text hover:text-accent"
            }`}
          >
            📊 Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("bids")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "bids"
                ? "text-accent border-b-2 border-accent bg-accent/10"
                : "text-brand-text hover:text-accent"
            }`}
          >
            💰 Lịch sử đấu giá
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "analytics"
                ? "text-accent border-b-2 border-accent bg-accent/10"
                : "text-brand-text hover:text-accent"
            }`}
          >
            📈 Phân tích
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bid Status Chart */}
              <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
                <h3 className="font-semibold text-brand-h mb-4 flex items-center gap-2">
                  <span>📊</span> Trạng thái đấu giá
                </h3>
                {/* SỬA ĐỔI: Thêm thuộc tính debounce={1} để tối ưu hóa render trên Vite */}
                <ResponsiveContainer width="100%" height={300} debounce={1}>
                  <PieChart>
                    <Pie
                      data={bidStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => name + ": " + (percent * 100).toFixed(0) + "%"}
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {bidStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Spending Chart */}
              <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
                <h3 className="font-semibold text-brand-h mb-4 flex items-center gap-2">
                  <span>💰</span> Chi tiêu & Tiết kiệm
                </h3>
                {/* SỬA ĐỔI: Thêm thuộc tính debounce={1} */}
                <ResponsiveContainer width="100%" height={300} debounce={1}>
                  <BarChart data={spendingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bids" && (
          <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
            <h3 className="font-semibold text-brand-h mb-4">
              💰 Lịch sử đấu giá
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left p-4 font-medium text-brand-h">Sản phẩm</th>
                    <th className="text-left p-4 font-medium text-brand-h">Số tiền</th>
                    <th className="text-left p-4 font-medium text-brand-h">Trạng thái</th>
                    <th className="text-left p-4 font-medium text-brand-h">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {userBids.map((bid, index) => (
                    <tr key={index} className="border-b border-brand-border hover:bg-code-bg transition">
                      <td className="p-4 font-medium text-brand-h">{bid.product_name}</td>
                      <td className="p-4 text-brand-text">{formatCurrency(bid.amount)}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            bid.status === "won"
                              ? "bg-green-100 text-green-800"
                              : bid.status === "lost"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {bid.status === "won" ? "Thắng" : bid.status === "lost" ? "Thua" : "Đang đấu"}
                        </span>
                      </td>
                      <td className="p-4 text-brand-text">{new Date(bid.date).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
            <h3 className="font-semibold text-brand-h mb-4">
              📈 Hoạt động đấu giá theo tuần
            </h3>
            {/* SỬA ĐỔI: Thêm thuộc tính debounce={1} */}
            <ResponsiveContainer width="100%" height={400} debounce={1}>
              <LineChart data={bidActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bids" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;