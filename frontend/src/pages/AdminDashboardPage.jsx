import { useState, useEffect } from "react";
import { adminService, productService } from "../services";
import { useAuth } from "../contexts";
import { formatCurrency, formatNumber, formatDate } from "../utils";
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
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [toast, setToast] = useState({ text: "", type: "" });

  // Real disputes/reports state from backend
  const [disputes, setDisputes] = useState([]);

  // Real activity logs from backend
  const [logs, setLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Payments Management States
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    total_revenue: 0,
    waiting_for_payout: 0,
    released_payments_count: 0,
    success_payments_count: 0,
    failed_payments_count: 0,
    pending_payments_count: 0,
    waiting_payments_count: 0,
    total_transactions: 0,
    daily_revenue: []
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState({
    search: "",
    status: "",
    startDate: "",
    endDate: ""
  });
  const [escrowSubTab, setEscrowSubTab] = useState("vnpay");

  const COLORS = ["#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6"];

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchDashboardData();
      const interval = setInterval(() => {
        fetchDashboardData(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [statsData, usersData, productsData, logsData, reportsData, transactionsData, paymentsData, paymentStatsData] = await Promise.all([
        adminService.getStats().catch(() => null),
        adminService.getAllUsers().catch(() => []),
        adminService.getAllProducts().catch(() => []),
        adminService.getSystemLogs({ limit: 100 }).catch(() => []),
        adminService.getReports().catch(() => []),
        adminService.getAllTransactions().catch(() => []),
        adminService.getAllPayments().catch(() => []),
        adminService.getPaymentStats().catch(() => null),
      ]);

      const fallbackStats = statsData || {
        total_users: usersData.length || 0,
        total_admins: usersData.filter(u => u.role === "admin").length || 0,
        total_sellers: usersData.filter(u => u.role === "seller").length || 0,
        total_buyers: usersData.filter(u => u.role === "buyer").length || 0,
        active_auctions: productsData.filter(p => p.status === "active").length || 0,
        ended_auctions: productsData.filter(p => p.status === "ended").length || 0,
        total_bids: productsData.reduce((sum, p) => sum + (p.bid_count || 0), 0) || 0,
        total_revenue: statsData?.total_revenue || 0,
        today_bids: statsData?.today_bids || 0,
      };

      setStats(fallbackStats);
      setUsers(usersData);
      setProducts(productsData);
      setPayments(paymentsData || []);
      setPaymentStats(paymentStatsData || {
        total_revenue: 0,
        waiting_for_payout: 0,
        released_payments_count: 0,
        success_payments_count: 0,
        failed_payments_count: 0,
        pending_payments_count: 0,
        waiting_payments_count: 0,
        total_transactions: 0,
        daily_revenue: []
      });

      if (logsData && logsData.length > 0) {
        setLogs(logsData.map(l => ({
          id: l.id,
          user: l.username || "System",
          action: l.details || l.action,
          time: l.created_at ? l.created_at.split("T")[1]?.substring(0, 8) : "Unknown"
        })));
      } else {
        setLogs([]);
      }

      setDisputes(reportsData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3000);
  };

  // 1.1 Accounts Actions
  const toggleUserBlock = async (userId) => {
    try {
      const response = await adminService.toggleUserBlock(userId);
      triggerToast(response.message || "Đã cập nhật trạng thái tài khoản!");
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi cập nhật trạng thái tài khoản!", "error");
    }
  };

  const resetUserPassword = async (userId, username, email) => {
    try {
      const response = await adminService.resetUserPassword(userId);
      triggerToast(`🔑 ${response.message}`);
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi reset mật khẩu!", "error");
    }
  };

  const verifySellerAccount = async (userId) => {
    try {
      const response = await adminService.verifySeller(userId);
      triggerToast(response.message || "Đã phê duyệt xác minh tài khoản Seller!");
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi xác minh tài khoản!", "error");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const response = await adminService.updateUserRole(userId, { role: newRole });
      triggerToast(response.message || `Đã chuyển vai trò sang ${newRole.toUpperCase()} thành công!`);
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi đổi vai trò!", "error");
    }
  };

  const handleApproveTransaction = async (txId) => {
    try {
      const response = await adminService.approveTransaction(txId);
      triggerToast(response.message || "Đã duyệt giao dịch thành công!");
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi duyệt giao dịch!", "error");
    }
  };

  const handleCompleteEscrow = async (productId) => {
    try {
      const response = await adminService.completeEscrow(productId);
      triggerToast(response.message || "Giải ngân ký quỹ thành công!");
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi giải ngân tiền!", "error");
    }
  };

  const handleReleasePayment = async (paymentId) => {
    try {
      const response = await adminService.releasePayment(paymentId);
      triggerToast(response.message || "Giải ngân tiền thầu cho Người bán thành công!");
      fetchDashboardData();
      if (showPaymentModal && selectedPayment && selectedPayment.id === paymentId) {
        const updatedDetail = await adminService.getPaymentDetails(paymentId);
        setSelectedPayment(updatedDetail);
      }
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi giải ngân tiền!", "error");
    }
  };

  const handleViewPaymentDetails = async (paymentId) => {
    try {
      const details = await adminService.getPaymentDetails(paymentId);
      setSelectedPayment(details);
      setShowPaymentModal(true);
    } catch (error) {
      triggerToast("Lỗi khi tải chi tiết thanh toán!", "error");
    }
  };

  // 1.2 Products Actions
  const approveProduct = async (productId) => {
    try {
      const response = await adminService.approveProduct(productId);
      triggerToast(response.message || "Đã duyệt sản phẩm thành công!");
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi duyệt sản phẩm!", "error");
    }
  };

  const rejectProduct = async (productId) => {
    try {
      const response = await adminService.rejectProduct(productId);
      triggerToast(response.message || "Đã từ chối duyệt sản phẩm!");
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi từ chối duyệt!", "error");
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm vi phạm này?")) {
      try {
        const response = await adminService.deleteProduct(productId);
        triggerToast(response.message || "Đã xóa sản phẩm thành công!");
        fetchDashboardData();
      } catch (error) {
        triggerToast(error.response?.data?.detail || "Lỗi khi xóa sản phẩm!", "error");
      }
    }
  };

  // 1.3 Auctions State Control
  const changeAuctionStatus = async (productId, action) => {
    try {
      let updatedStatus = "active";
      if (action === "pause") updatedStatus = "paused";
      else if (action === "resume") updatedStatus = "active";
      else if (action === "cancel") updatedStatus = "cancelled";
      else if (action === "end") updatedStatus = "ended";

      await productService.updateProductStatus(productId, updatedStatus);
      triggerToast(`Cập nhật trạng thái phiên thành công!`);
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi cập nhật trạng thái phiên!", "error");
    }
  };

  const handleForceCloseAuction = async (productId) => {
    if (window.confirm("Bạn có chắc chắn muốn kết thúc sớm phiên đấu giá này không?")) {
      try {
        const response = await adminService.forceCloseAuction(productId);
        triggerToast(response.message || "Đã kết thúc sớm phiên đấu giá thành công!");
        fetchDashboardData();
      } catch (error) {
        triggerToast(error.response?.data?.detail || "Lỗi khi kết thúc sớm phiên đấu giá!", "error");
      }
    }
  };

  // 1.4 Disputes Resolution
  const resolveDispute = async (disputeId) => {
    try {
      const response = await adminService.resolveReport(disputeId, { action: "resolve" });
      triggerToast(response.message || "Đã phân xử khiếu nại thành công!");
      fetchDashboardData();
    } catch (error) {
      triggerToast(error.response?.data?.detail || "Lỗi khi xử lý khiếu nại!", "error");
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  // Distribution chart data structures
  const userRoleData = [
    { name: "Ban quản trị", value: stats?.total_admins || 2 },
    { name: "Người bán (Seller)", value: stats?.total_sellers || 32 },
    { name: "Khách hàng (Buyer)", value: stats?.total_buyers || 120 },
  ];

  const auctionStatusData = [
    { name: "Đang đấu giá", value: stats?.active_auctions || 14 },
    { name: "Đã hoàn thành", value: stats?.ended_auctions || 45 },
  ];

  const revenueData = [
    { name: "Doanh thu", value: stats?.total_revenue || 183000000 },
  ];

  // Filtering users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtering payments list (VNPAY Transactions)
  const filteredPayments = payments.filter((pay) => {
    const matchesSearch =
      !paymentFilters.search ||
      pay.product.title.toLowerCase().includes(paymentFilters.search.toLowerCase()) ||
      pay.buyer.username.toLowerCase().includes(paymentFilters.search.toLowerCase()) ||
      (pay.seller && pay.seller.username && pay.seller.username.toLowerCase().includes(paymentFilters.search.toLowerCase()));
      
    const matchesStatus = !paymentFilters.status || pay.status === paymentFilters.status;
    
    let matchesDate = true;
    if (paymentFilters.startDate) {
      const start = new Date(paymentFilters.startDate);
      const payDate = new Date(pay.created_at);
      matchesDate = matchesDate && payDate >= start;
    }
    if (paymentFilters.endDate) {
      const end = new Date(paymentFilters.endDate);
      end.setHours(23, 59, 59, 999);
      const payDate = new Date(pay.created_at);
      matchesDate = matchesDate && payDate <= end;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-[#f6f5f0] dark:bg-[#0b0f14] p-4 md:p-6 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              🛡️ BẢNG ĐIỀU KHIỂN
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Quản trị viên: <span className="text-slate-900 dark:text-white font-bold">{user.username}</span> | Toàn quyền kiểm soát cơ sở dữ liệu.
            </p>
          </div>
          <div className="px-2.5 py-1 text-[10px] font-black bg-slate-950 text-amber-400 border border-slate-850 rounded-full uppercase tracking-wider">
            🔒 NGƯỜI TRUY CẬP ĐANG HOẠT ĐỘNG
          </div>
        </div>

        {/* Global Toast Alert banner */}
        {toast.text && (
          <div className={`p-4 rounded-xl border text-xs font-bold text-center transition-all ${toast.type === "error"
            ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
            : "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
            }`}>
            {toast.text}
          </div>
        )}

        {/* Dynamic flat metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng người dùng</span>
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black">{formatNumber(stats?.total_users || 0)}</span>
              <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">👥</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đang hoạt động</span>
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black text-amber-500">{formatNumber(stats?.active_auctions || 0)}</span>
              <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-sm">🔥</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng thầu bid</span>
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black text-emerald-500">{formatNumber(stats?.total_bids || 0)}</span>
              <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-sm">💰</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doanh thu sàn</span>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-indigo-500">{formatCurrency(stats?.total_revenue || 0)}</span>
              <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-sm">💎</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold">
          {[
            { id: "overview", label: "📊 Tổng quan" },
            { id: "users", label: "👥 Người dùng (1.1)" },
            { id: "products", label: "📦 Sản phẩm & Đấu giá (1.2 / 1.3)" },
            { id: "escrow", label: "💳 Quản lý thanh toán" },
            { id: "disputes", label: "⚖️ Tranh chấp & Khiếu nại (1.4)" },
            { id: "system-logs", label: "📜 Nhật ký hệ thống (1.6)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition ${activeTab === tab.id
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow"
                : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Distribution Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">Phân bổ vai trò (1.5)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                      >
                        {userRoleData.map((e, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Auction status chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">Trạng thái phiên đấu giá (1.5)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={auctionStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#64748b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Revenue distribution bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">Doanh thu sàn</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
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

        {activeTab === "users" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">

            {/* Account Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Tìm kiếm tài khoản (username, email)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-slate-400"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:outline-none"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="buyer">Người mua (Buyer)</option>
                <option value="seller">Người bán (Seller)</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="p-3">ID</th>
                    <th className="p-3">Tên tài khoản</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3 text-center">Xác minh Seller</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-right">Điều khiển</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                      <td className="p-3 text-slate-400 font-mono">#{u.id}</td>
                      <td className="p-3 text-slate-900 dark:text-white font-bold">{u.username}</td>
                      <td className="p-3 text-slate-500">{u.email}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded px-1.5 py-1 text-[10px] font-black text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="buyer">BUYER</option>
                          <option value="seller">SELLER</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        {u.role === "seller" ? (
                          u.isVerified ? (
                            <span className="text-emerald-500 font-bold">✓ Đã xác minh</span>
                          ) : (
                            <button
                              onClick={() => verifySellerAccount(u.id)}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[9px]"
                            >
                              Duyệt xác minh
                            </button>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.isBlocked
                          ? "bg-red-155/15 text-red-500"
                          : "bg-green-155/15 text-green-500"
                          }`}>
                          {u.isBlocked ? "Đã khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => resetUserPassword(u.id, u.username, u.email)}
                          className="px-2 py-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px]"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => toggleUserBlock(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black text-white ${u.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                          {u.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              📋 Kiểm duyệt sản phẩm & Trạng thái phiên đấu giá
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="p-3">Mã phiên</th>
                    <th className="p-3">Tên vật phẩm</th>
                    <th className="p-3">Mức giá thầu</th>
                    <th className="p-3 text-center">Lượt bid</th>
                    <th className="p-3 text-center">Duyệt sản phẩm (1.2)</th>
                    <th className="p-3 text-center">Thời gian thực (1.3)</th>
                    <th className="p-3 text-right">Kiểm soát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                      <td className="p-3 text-slate-400 font-mono">#{p.id}</td>
                      <td className="p-3 text-slate-900 dark:text-white font-bold">{p.title}</td>
                      <td className="p-3 font-semibold text-indigo-500">{formatCurrency(p.current_price)}</td>
                      <td className="p-3 text-center">{p.bid_count}</td>
                      <td className="p-3 text-center">
                        {p.isApproved ? (
                          <span className="text-emerald-500 font-bold">Đã duyệt</span>
                        ) : p.status === "rejected" ? (
                          <span className="text-red-500 font-bold">Từ chối</span>
                        ) : (
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => approveProduct(p.id)}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-[9px]"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => rejectProduct(p.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[9px]"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${p.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : p.status === "paused"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                          }`}>
                          {p.status === "active"
                            ? "Đang chạy"
                            : p.status === "paused"
                              ? "Tạm dừng"
                              : p.status === "cancelled"
                                ? "Đã hủy"
                                : "Đã xong"}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        {p.status === "active" && (
                          <>
                            <button
                              onClick={() => changeAuctionStatus(p.id, "pause")}
                              className="px-2 py-1 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-lg text-[9px]"
                            >
                              Tạm dừng
                            </button>
                            <button
                              onClick={() => changeAuctionStatus(p.id, "cancel")}
                              className="px-2 py-1 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-[9px]"
                            >
                              Hủy phiên
                            </button>
                            <button
                              onClick={() => handleForceCloseAuction(p.id)}
                              className="px-2 py-1 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-lg text-[9px]"
                            >
                              Kết thúc sớm
                            </button>
                          </>
                        )}
                        {p.status === "paused" && (
                          <button
                            onClick={() => changeAuctionStatus(p.id, "resume")}
                            className="px-2 py-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[9px]"
                          >
                            Tiếp tục
                          </button>
                        )}
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="px-2 py-1 text-red-500 hover:underline text-[9px] font-bold"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {activeTab === "escrow" && (
          <div className="space-y-6 animate-fade-in text-xs">
            {/* Top statistics overview for Payments */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</span>
                <span className="text-lg font-black text-indigo-500 mt-2">{formatCurrency(paymentStats.total_revenue)}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waiting for Payout</span>
                <span className="text-lg font-black text-orange-500 mt-2">{formatCurrency(paymentStats.waiting_for_payout)}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Released Payments</span>
                <span className="text-lg font-black text-green-500 mt-2">{paymentStats.released_payments_count} GD</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Success Payments</span>
                <span className="text-lg font-black text-blue-500 mt-2">{paymentStats.success_payments_count} GD</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Failed Payments</span>
                <span className="text-lg font-black text-red-500 mt-2">{paymentStats.failed_payments_count} GD</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Transactions</span>
                <span className="text-lg font-black text-slate-700 dark:text-slate-300 mt-2">{paymentStats.total_transactions} GD</span>
              </div>
            </div>

            {/* Sub-tabs Selector */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-bold">
              <button
                onClick={() => setEscrowSubTab("vnpay")}
                className={`px-4 py-2 rounded-xl transition ${escrowSubTab === "vnpay"
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  }`}
              >
                💳 Giao dịch VNPAY (Thanh toán thầu)
              </button>
              <button
                onClick={() => setEscrowSubTab("vietqr")}
                className={`px-4 py-2 rounded-xl transition ${escrowSubTab === "vietqr"
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                  }`}
              >
                🏦 Duyệt giao dịch VietQR ({transactions.filter(t => t.status === "pending").length})
              </button>
            </div>

            {escrowSubTab === "vnpay" && (
              <div className="space-y-6">
                {/* Advanced Search & Filtering */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tìm kiếm</label>
                      <input
                        type="text"
                        placeholder="Tìm sản phẩm, Buyer, Seller..."
                        value={paymentFilters.search}
                        onChange={(e) => setPaymentFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trạng thái</label>
                      <select
                        value={paymentFilters.status}
                        onChange={(e) => setPaymentFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="SUCCESS">Thành công (Paid)</option>
                        <option value="WaitingForPayout">Chờ giải ngân (Waiting for Payout)</option>
                        <option value="Released">Đã giải ngân (Released)</option>
                        <option value="PENDING">Đang chờ (Pending)</option>
                        <option value="FAILED">Thất bại (Failed)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Từ ngày</label>
                      <input
                        type="date"
                        value={paymentFilters.startDate}
                        onChange={(e) => setPaymentFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Đến ngày</label>
                      <input
                        type="date"
                        value={paymentFilters.endDate}
                        onChange={(e) => setPaymentFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* VNPAY Payments Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      📋 Danh sách giao dịch VNPAY ({filteredPayments.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                          <th className="p-3">Mã GD</th>
                          <th className="p-3">Sản phẩm</th>
                          <th className="p-3">Số tiền</th>
                          <th className="p-3">Người mua</th>
                          <th className="p-3">Người bán</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                        {filteredPayments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">#{pay.id}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">{pay.product.title}</td>
                            <td className="p-3 text-indigo-650 font-bold">{formatCurrency(pay.amount)}</td>
                            <td className="p-3">{pay.buyer.username}</td>
                            <td className="p-3">{pay.seller?.username || "N/A"}</td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase self-start ${
                                  pay.status === "Released"
                                    ? "bg-green-100 text-green-700 dark:bg-green-955/30 dark:text-green-400"
                                    : pay.status === "WaitingForPayout"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400"
                                    : pay.status === "SUCCESS"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-955/30 dark:text-blue-400"
                                    : pay.status === "FAILED"
                                    ? "bg-red-100 text-red-700 dark:bg-red-955/30 dark:text-red-400"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                  {pay.status === "Released"
                                    ? "Đã giải ngân"
                                    : pay.status === "WaitingForPayout"
                                    ? "Chờ giải ngân"
                                    : pay.status === "SUCCESS"
                                    ? "Thành công"
                                    : pay.status === "FAILED"
                                    ? "Thất bại"
                                    : "Đang chờ"}
                                </span>
                                {pay.status === "Released" && (
                                  <>
                                    {pay.released_by && (
                                      <span className="text-[9px] text-slate-450 mt-1 font-bold">
                                        By: {pay.released_by}
                                      </span>
                                    )}
                                    {pay.released_time && (
                                      <span className="text-[8.5px] text-slate-400 font-medium">
                                        {formatDate(pay.released_time)}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-3 space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleViewPaymentDetails(pay.id)}
                                className="px-2.5 py-1 border border-slate-350 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-lg text-[10px]"
                              >
                                Chi tiết
                              </button>
                              {pay.status === "WaitingForPayout" && (
                                <button
                                  onClick={() => handleReleasePayment(pay.id)}
                                  className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px]"
                                >
                                  Release Payment
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredPayments.length === 0 && (
                          <tr>
                            <td colSpan="7" className="p-6 text-center text-slate-400 font-semibold">
                              Không tìm thấy giao dịch VNPAY nào phù hợp bộ lọc.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Revenue Daily Statistics Chart */}
                {paymentStats.daily_revenue && paymentStats.daily_revenue.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      📈 Biểu đồ thống kê doanh thu giải ngân theo ngày
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={paymentStats.daily_revenue} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                          <YAxis tickFormatter={(v) => v >= 1000000 ? (v * 0.000001).toLocaleString("vi-VN") + " Tr" : v.toLocaleString("vi-VN")} width={80} stroke="#64748b" fontSize={10} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {escrowSubTab === "vietqr" && (
              <div className="space-y-6">
                {/* VietQR Transactions Approvals */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      💳 Duyệt giao dịch VietQR (Nạp tiền & Thanh toán)
                    </h3>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
                      {transactions.filter(t => t.status === "pending").length} Giao dịch chờ duyệt
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                          <th className="p-3">Mã GD</th>
                          <th className="p-3">Người dùng</th>
                          <th className="p-3">Số tiền</th>
                          <th className="p-3">Loại</th>
                          <th className="p-3">Mô tả chi tiết</th>
                          <th className="p-3">Trạng thái</th>
                          <th className="p-3">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                        {transactions.filter(t => t.status === "pending" || t.payment_method === "VietQR").map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">#{t.id}</td>
                            <td className="p-3">Thành viên #{t.user_id}</td>
                            <td className="p-3 text-red-500 font-bold">{formatCurrency(t.amount)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.transaction_type === "deposit" ? "bg-amber-100 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-955/30 dark:text-blue-400"}`}>
                                {t.transaction_type === "deposit" ? "Nạp tiền" : "Thanh toán"}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs truncate">{t.description}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.status === "pending" ? "bg-amber-100 text-amber-700" : t.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {t.status === "pending" ? "Chờ duyệt" : t.status === "completed" ? "Thành công" : "Thất bại"}
                              </span>
                            </td>
                            <td className="p-3">
                              {t.status === "pending" ? (
                                <button
                                  onClick={() => handleApproveTransaction(t.id)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-[10px]"
                                >
                                  Duyệt VietQR
                                </button>
                              ) : (
                                <span className="text-slate-400 font-bold text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {transactions.filter(t => t.status === "pending" || t.payment_method === "VietQR").length === 0 && (
                          <tr>
                            <td colSpan="7" className="p-6 text-center text-slate-400 font-semibold">
                              Không có giao dịch VietQR nào cần xử lý.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legacy Escrow Release to Seller (Just in case they also need manual VietQR release fallback) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      📦 Đối soát giải ngân ký quỹ cho Người bán (Seller) - Phụ
                    </h3>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                      {products.filter(p => p.status === "completed" && p.bid_count > 0).length} Đơn chờ giải ngân
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                          <th className="p-3">Mã sản phẩm</th>
                          <th className="p-3">Tên sản phẩm</th>
                          <th className="p-3">Tiền ký quỹ thắng thầu</th>
                          <th className="p-3">Người bán</th>
                          <th className="p-3">Giao nhận</th>
                          <th className="p-3">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-350">
                        {products.filter(p => ["completed", "delivered"].includes(p.status) && p.bid_count > 0).map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">#{p.id}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{p.title}</td>
                            <td className="p-3 text-emerald-600 font-bold">{formatCurrency(p.current_price)}</td>
                            <td className="p-3">Thành viên #{p.seller_id}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.status === "completed" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                                {p.status === "completed" ? "Chờ giải ngân" : "Hoàn tất"}
                              </span>
                            </td>
                            <td className="p-3">
                              {p.status === "completed" ? (
                                <button
                                  onClick={() => handleCompleteEscrow(p.id)}
                                  className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px]"
                                >
                                  Giải ngân ví Seller
                                </button>
                              ) : (
                                <span className="text-slate-500 font-bold text-[10px]">✅ Đã giải ngân</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {products.filter(p => ["completed", "delivered"].includes(p.status) && p.bid_count > 0).length === 0 && (
                          <tr>
                            <td colSpan="6" className="p-6 text-center text-slate-400 font-semibold">
                              Không có đơn hàng nào chờ giải ngân ký quỹ.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "disputes" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              ⚖️ Xử lý tranh chấp & Khiếu nại từ khách hàng (1.4)
            </h3>

            <div className="space-y-4">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">Mã tranh chấp #{d.id}</span>
                      <span className="text-[10px] text-slate-400">{d.date}</span>
                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${d.status === "Đã phân xử xong"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                        }`}>
                        {d.status}
                      </span>
                    </div>
                    <p className="text-slate-500">
                      Nguyên đơn: <strong className="text-slate-800 dark:text-slate-200">{d.reporter}</strong> | Bị đơn: <strong className="text-slate-800 dark:text-slate-200">{d.reported}</strong>
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 font-bold">Nội dung khiếu nại: {d.reason}</p>
                  </div>

                  {d.status !== "Đã phân xử xong" && (
                    <div className="self-end sm:self-center">
                      <button
                        onClick={() => resolveDispute(d.id)}
                        className="px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold rounded-xl text-xs shadow-md"
                      >
                        Giải quyết tranh chấp
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "system-logs" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              📜 Nhật ký kiểm duyệt & Đăng nhập hệ thống (1.6)
            </h3>

            <div className="bg-slate-950 text-slate-350 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className="text-slate-400">ID: #{log.id}</span>
                  <span className="text-violet-400">&lt;{log.user}&gt;</span>
                  <span className="text-slate-200">{log.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VNPAY Payment Details Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    💳 Chi tiết thanh toán #{selectedPayment.id}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Phương thức thanh toán VNPAY | Tạo lúc: {selectedPayment.created_at}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold transition text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[70vh] text-slate-700 dark:text-slate-300">
                {/* Product Info */}
                <div className="bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase text-[10px]">
                    📦 Thông tin đơn hàng
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <p>Sản phẩm: <strong className="text-slate-900 dark:text-white">{selectedPayment.product.title}</strong></p>
                    <p>Mã sản phẩm: <strong className="text-slate-900 dark:text-white">#{selectedPayment.product.id}</strong></p>
                    <p>Trạng thái đơn: <strong className="text-slate-900 dark:text-white uppercase text-[10px]">{selectedPayment.product.status}</strong></p>
                    <p>Số tiền thầu: <strong className="text-red-500 text-sm">{formatCurrency(selectedPayment.amount)}</strong></p>
                  </div>
                </div>

                {/* Buyer & Seller Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase text-[10px]">
                      👤 Người mua (Buyer)
                    </h4>
                    <p>Username: <strong className="text-slate-900 dark:text-white">{selectedPayment.buyer.username}</strong></p>
                    <p>Email: <strong className="text-slate-900 dark:text-white">{selectedPayment.buyer.email}</strong></p>
                    <p>SĐT: <strong className="text-slate-900 dark:text-white">{selectedPayment.buyer.phone || "Chưa cập nhật"}</strong></p>
                    <p>Địa chỉ: <strong className="text-slate-900 dark:text-white">{selectedPayment.buyer.address || "Chưa cập nhật"}</strong></p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase text-[10px]">
                      🏪 Người bán (Seller)
                    </h4>
                    <p>Username: <strong className="text-slate-900 dark:text-white">{selectedPayment.seller.username}</strong></p>
                    <p>Email: <strong className="text-slate-900 dark:text-white">{selectedPayment.seller.email}</strong></p>
                    <p>SĐT: <strong className="text-slate-900 dark:text-white">{selectedPayment.seller.phone || "Chưa cập nhật"}</strong></p>
                    <p>Địa chỉ: <strong className="text-slate-900 dark:text-white">{selectedPayment.seller.address || "Chưa cập nhật"}</strong></p>
                  </div>
                </div>

                {/* VNPAY Gate Metadata */}
                <div className="bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 uppercase text-[10px]">
                    🌐 Chi tiết cổng VNPAY
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <p>Mã giao dịch cổng: <strong className="text-slate-900 dark:text-white">{selectedPayment.vnpay_details?.vnp_transaction_no || "N/A"}</strong></p>
                    <p>Ngân hàng: <strong className="text-slate-900 dark:text-white">{selectedPayment.vnpay_details?.bank_code || "N/A"}</strong></p>
                    <p>Loại thẻ: <strong className="text-slate-900 dark:text-white">{selectedPayment.vnpay_details?.card_type || "N/A"}</strong></p>
                    <p>Mã phản hồi: <strong className="text-slate-900 dark:text-white">{selectedPayment.vnpay_details?.response_code || "N/A"}</strong></p>
                    <p className="col-span-2">Ngày giao dịch VNPAY: <strong className="text-slate-900 dark:text-white">{selectedPayment.vnpay_details?.transaction_date || "N/A"}</strong></p>
                  </div>
                </div>

                {/* Release Info */}
                {selectedPayment.status === "Released" && (
                  <div className="bg-green-50 dark:bg-green-955/20 p-4 rounded-xl border border-green-200 dark:border-green-900/50 space-y-2">
                    <h4 className="font-bold text-green-800 dark:text-green-400 border-b border-green-200 dark:border-green-900 pb-1.5 uppercase text-[10px]">
                      💰 Thông tin giải ngân
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <p>Người giải ngân: <strong className="text-slate-900 dark:text-white">{selectedPayment.released_by}</strong></p>
                       <p>Thời gian: <strong className="text-slate-900 dark:text-white">{selectedPayment.released_time ? formatDate(selectedPayment.released_time) : "N/A"}</strong></p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 bg-slate-50 dark:bg-slate-850 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-350 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-xl"
                >
                  Đóng
                </button>
                {selectedPayment.status === "WaitingForPayout" && (
                  <button
                    onClick={() => handleReleasePayment(selectedPayment.id)}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-xl"
                  >
                    Release Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboardPage;