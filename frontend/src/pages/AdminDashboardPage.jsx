import { useState, useEffect } from "react";
import { adminService } from "../services";
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
  Legend,
  ResponsiveContainer,
} from "recharts";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, productsData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers({ limit: 10 }),
        adminService.getAllProducts({ limit: 10 }),
      ]);
      setStats(statsData);
      setRecentUsers(usersData);
      setRecentProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-page-bg p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-brand-text">
            Bạn không có quyền truy cập trang này. Chỉ Admin mới có thể xem
            Dashboard.
          </p>
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
  const userRoleData = [
    { name: "Admin", value: stats?.total_admins || 0 },
    { name: "Seller", value: stats?.total_sellers || 0 },
    { name: "Buyer", value: stats?.total_buyers || 0 },
  ];

  const auctionStatusData = [
    { name: "Đang hoạt động", value: stats?.active_auctions || 0 },
    { name: "Đã kết thúc", value: stats?.ended_auctions || 0 },
  ];

  const revenueData = [
    { name: "Doanh thu", value: stats?.total_revenue || 0 },
  ];

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-h mb-2">
            🎛️ Admin Dashboard
          </h1>
          <p className="text-brand-text text-lg">
            Chào mừng, {user.username}! Tổng quan hệ thống đấu giá.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">👥 Tổng người dùng</p>
                <p className="text-4xl font-bold">{formatNumber(stats?.total_users || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">🔥 Đang đấu giá</p>
                <p className="text-4xl font-bold">{formatNumber(stats?.active_auctions || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">🔥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">💰 Tổng lượt bid</p>
                <p className="text-4xl font-bold">{formatNumber(stats?.total_bids || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">💎 Doanh thu</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
              </div>
              <div className="text-5xl opacity-80">💎</div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-brand-border rounded-xl p-5 bg-brand-bg">
            <p className="text-sm text-brand-text mb-2">📈 Bid hôm nay</p>
            <p className="text-2xl font-bold text-accent">{formatNumber(stats?.today_bids || 0)}</p>
          </div>
          <div className="border border-brand-border rounded-xl p-5 bg-brand-bg">
            <p className="text-sm text-brand-text mb-2">📊 Tỷ lệ hoạt động</p>
            <p className="text-2xl font-bold text-green-600">
              {stats?.total_users > 0 ? Math.round(((stats?.active_auctions || 0) / (stats?.total_users || 1)) * 100) : 0}%
            </p>
          </div>
          <div className="border border-brand-border rounded-xl p-5 bg-brand-bg">
            <p className="text-sm text-brand-text mb-2">⚡ Tăng trưởng</p>
            <p className="text-2xl font-bold text-blue-600">
              +{formatNumber(stats?.total_users || 0)}%
            </p>
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
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "users"
                ? "text-accent border-b-2 border-accent bg-accent/10"
                : "text-brand-text hover:text-accent"
            }`}
          >
            👥 Người dùng
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "products"
                ? "text-accent border-b-2 border-accent bg-accent/10"
                : "text-brand-text hover:text-accent"
            }`}
          >
            📦 Sản phẩm
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
              {/* User Distribution Chart */}
              <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
                <h3 className="font-semibold text-brand-h mb-4 flex items-center gap-2">
                  <span>👥</span> Phân phối người dùng
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => name + ": " + (percent * 100).toFixed(0) + "%"}
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Auction Status Chart */}
              <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
                <h3 className="font-semibold text-brand-h mb-4 flex items-center gap-2">
                  <span>📊</span> Trạng thái đấu giá
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={auctionStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => name + ": " + (percent * 100).toFixed(0) + "%"}
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {auctionStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#10b981" : "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
              <h3 className="font-semibold text-brand-h mb-4 flex items-center gap-2">
                <span>💰</span> Doanh thu hệ thống
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
            <h3 className="font-semibold text-brand-h mb-4">
              👥 Người dùng gần đây
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left p-4 font-medium text-brand-h">ID</th>
                    <th className="text-left p-4 font-medium text-brand-h">
                      Tên đăng nhập
                    </th>
                    <th className="text-left p-4 font-medium text-brand-h">Email</th>
                    <th className="text-left p-4 font-medium text-brand-h">Vai trò</th>
                    <th className="text-left p-4 font-medium text-brand-h">
                      Lượt bid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-brand-border hover:bg-code-bg transition">
                      <td className="p-4 text-brand-text">{u.id}</td>
                      <td className="p-4 font-medium text-brand-h">{u.username}</td>
                      <td className="p-4 text-brand-text">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "seller"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-brand-text">{u.bid_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
            <h3 className="font-semibold text-brand-h mb-4">
              📦 Sản phẩm gần đây
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left p-4 font-medium text-brand-h">ID</th>
                    <th className="text-left p-4 font-medium text-brand-h">
                      Tên sản phẩm
                    </th>
                    <th className="text-left p-4 font-medium text-brand-h">
                      Giá hiện tại
                    </th>
                    <th className="text-left p-4 font-medium text-brand-h">
                      Trạng thái
                    </th>
                    <th className="text-left p-4 font-medium text-brand-h">
                      Lượt bid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map((p) => (
                    <tr key={p.id} className="border-b border-brand-border hover:bg-code-bg transition">
                      <td className="p-4 text-brand-text">{p.id}</td>
                      <td className="p-4 font-medium text-brand-h line-clamp-1">
                        {p.title}
                      </td>
                      <td className="p-4 text-brand-text">
                        {formatCurrency(p.current_price)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            p.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {p.status === "active" ? "Đang đấu giá" : "Đã kết thúc"}
                        </span>
                      </td>
                      <td className="p-4 text-brand-text">{p.bid_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
              <h3 className="font-semibold text-brand-h mb-4">
                📈 Tăng trưởng người dùng (Dự kiến)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { name: "Tháng 1", users: 10 },
                    { name: "Tháng 2", users: 25 },
                    { name: "Tháng 3", users: 45 },
                    { name: "Tháng 4", users: 70 },
                    { name: "Tháng 5", users: 100 },
                    { name: "Tháng 6", users: stats?.total_users || 150 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bid Activity Chart */}
            <div className="border border-brand-border rounded-xl p-6 bg-brand-bg">
              <h3 className="font-semibold text-brand-h mb-4">
                📊 Hoạt động đặt giá (Dự kiến)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: "T2", bids: 50 },
                    { name: "T3", bids: 120 },
                    { name: "T4", bids: 200 },
                    { name: "T5", bids: 350 },
                    { name: "T6", bids: 500 },
                    { name: "CN", bids: stats?.today_bids || 20 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bids" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;