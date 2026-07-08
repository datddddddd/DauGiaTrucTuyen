import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://dau-gia-api.onrender.com/api";

const TABS = [
  { id: "dashboard", label: "Tổng quan", icon: "📊" },
  { id: "products", label: "Sản phẩm", icon: "📦" },
  { id: "create", label: "Tạo phiên mới", icon: "➕" },
  { id: "users", label: "Người dùng", icon: "👥" },
];

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-bg p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-text m-0">{label}</p>
      <p className={`text-3xl font-black mt-2 mb-0 ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
        isActive
          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {isActive ? "Đang diễn ra" : "Đã kết thúc"}
    </span>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
        isAdmin
          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
      }`}
    >
      {isAdmin ? "Admin" : "Buyer"}
    </span>
  );
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditModal({ title, onClose, onSubmit, children }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b0f14]/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-bg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h4 className="text-base font-bold text-brand-h m-0">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-text hover:text-brand-h text-lg leading-none"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
          {children}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-brand-border text-brand-h hover:bg-code-bg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-bold bg-accent text-white hover:opacity-90"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent";
const labelCls = "text-xs font-semibold text-brand-text block mb-1";

export default function AdminPanel({
  token,
  username,
  onBack,
  onProductsChanged,
  showAlert,
  showConfirm,
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [productFilter, setProductFilter] = useState("all");
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    start_price: "",
    step_price: "",
    duration_hours: "24",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchStats = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: authHeaders });
    if (res.ok) setStats(await res.json());
  }, [token]);

  const fetchProducts = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/admin/products`, { headers: authHeaders });
    if (res.ok) setProducts(await res.json());
  }, [token]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: authHeaders });
    if (res.ok) setUsers(await res.json());
  }, [token]);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") await fetchStats();
      if (activeTab === "products" || activeTab === "create") await fetchProducts();
      if (activeTab === "users") await fetchUsers();
    } catch {
      showAlert({ title: "Lỗi", message: "Không thể tải dữ liệu admin.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchStats, fetchProducts, fetchUsers, showAlert]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          title: newProduct.title,
          description: newProduct.description,
          start_price: parseInt(newProduct.start_price),
          step_price: parseInt(newProduct.step_price),
          duration_hours: parseInt(newProduct.duration_hours),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert({ title: "Lỗi", message: data.detail || "Không thể tạo sản phẩm.", variant: "error" });
        return;
      }
      showAlert({ title: "Thành công", message: data.message || "Đã tạo phiên đấu giá mới.", variant: "success" });
      setNewProduct({ title: "", description: "", start_price: "", step_price: "", duration_hours: "24" });
      onProductsChanged?.();
      setActiveTab("products");
      fetchProducts();
      fetchStats();
    } catch {
      showAlert({ title: "Lỗi kết nối", message: "Không thể kết nối đến Backend.", variant: "error" });
    }
  };

  const handleCloseAuction = async (product) => {
    const confirmed = await showConfirm({
      title: "Đóng phiên đấu giá",
      message: `Bạn có chắc muốn đóng phiên "${product.title}" ngay lập tức?`,
      variant: "warning",
      okText: "Đóng phiên",
      cancelText: "Hủy",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}/close`, {
        method: "PUT",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert({ title: "Lỗi", message: data.detail || "Không thể đóng phiên.", variant: "error" });
        return;
      }
      showAlert({ title: "Thành công", message: data.message, variant: "success" });
      fetchProducts();
      fetchStats();
      onProductsChanged?.();
    } catch {
      showAlert({ title: "Lỗi kết nối", message: "Không thể kết nối đến Backend.", variant: "error" });
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct({
      id: product.id,
      title: product.title,
      description: product.description || "",
      start_price: product.start_price,
      step_price: String(product.step_price),
      current_price: String(product.current_price),
      end_time: toDatetimeLocal(product.end_time),
      status: product.status,
      bid_count: product.bid_count,
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          title: editingProduct.title,
          description: editingProduct.description,
          step_price: parseInt(editingProduct.step_price),
          current_price: parseInt(editingProduct.current_price),
          end_time: editingProduct.end_time,
          status: editingProduct.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert({ title: "Lỗi", message: data.detail || "Không thể cập nhật sản phẩm.", variant: "error" });
        return;
      }
      showAlert({ title: "Thành công", message: data.message, variant: "success" });
      setEditingProduct(null);
      fetchProducts();
      fetchStats();
      onProductsChanged?.();
    } catch {
      showAlert({ title: "Lỗi kết nối", message: "Không thể kết nối đến Backend.", variant: "error" });
    }
  };

  const openEditUser = (user) => {
    setEditingUser({
      username: user.username,
      email: user.email,
      role: user.role,
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${editingUser.username}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          email: editingUser.email,
          role: editingUser.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert({ title: "Lỗi", message: data.detail || "Không thể cập nhật người dùng.", variant: "error" });
        return;
      }
      showAlert({ title: "Thành công", message: data.message, variant: "success" });
      setEditingUser(null);
      fetchUsers();
    } catch {
      showAlert({ title: "Lỗi kết nối", message: "Không thể kết nối đến Backend.", variant: "error" });
    }
  };

  const handleToggleRole = async (user) => {
    if (user.username === username) {
      showAlert({ title: "Không được phép", message: "Bạn không thể thay đổi quyền của chính mình.", variant: "warning" });
      return;
    }
    const newRole = user.role === "admin" ? "buyer" : "admin";
    const confirmed = await showConfirm({
      title: "Thay đổi quyền",
      message: `Đổi quyền "${user.username}" thành ${newRole === "admin" ? "Quản trị viên" : "Người mua"}?`,
      variant: "warning",
      okText: "Xác nhận",
      cancelText: "Hủy",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${user.username}/role`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAlert({ title: "Lỗi", message: data.detail || "Không thể cập nhật quyền.", variant: "error" });
        return;
      }
      showAlert({ title: "Thành công", message: data.message, variant: "success" });
      fetchUsers();
    } catch {
      showAlert({ title: "Lỗi kết nối", message: "Không thể kết nối đến Backend.", variant: "error" });
    }
  };

  const filteredProducts =
    productFilter === "all" ? products : products.filter((p) => p.status === productFilter);

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN");
  };

  return (
    <div className="min-h-screen bg-page-bg flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-brand-border bg-brand-bg hidden md:flex flex-col">
        <div className="p-5 border-b border-brand-border">
          <h2 className="text-lg font-bold text-brand-h m-0">Admin Panel</h2>
          <p className="text-xs text-brand-text mt-1 m-0">{username}</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-sm"
                  : "text-brand-text hover:bg-code-bg"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-brand-border">
          <button
            type="button"
            onClick={onBack}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-medium border border-brand-border text-brand-h hover:bg-code-bg transition"
          >
            ⬅️ Về sàn đấu giá
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-brand-border bg-brand-bg">
          <h2 className="text-base font-bold text-brand-h m-0">Admin Panel</h2>
          <button type="button" onClick={onBack} className="text-sm text-accent font-medium">
            Về sàn
          </button>
        </div>
        <div className="md:hidden flex gap-1 p-2 overflow-x-auto border-b border-brand-border bg-brand-bg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === tab.id ? "bg-accent text-white" : "text-brand-text"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 max-w-5xl">
          {loading && (
            <p className="text-sm text-brand-text mb-4">⏳ Đang tải dữ liệu...</p>
          )}

          {/* Dashboard */}
          {activeTab === "dashboard" && stats && (
            <div>
              <h3 className="text-xl font-bold text-brand-h mb-6">Tổng quan hệ thống</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Người dùng" value={stats.total_users} color="text-accent" />
                <StatCard label="Phiên đang chạy" value={stats.active_auctions} color="text-green-500" />
                <StatCard label="Phiên đã kết thúc" value={stats.ended_auctions} color="text-brand-text" />
                <StatCard label="Tổng lượt đấu giá" value={stats.total_bids} color="text-amber-500" />
              </div>
            </div>
          )}

          {/* Products list */}
          {activeTab === "products" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h3 className="text-xl font-bold text-brand-h m-0">Quản lý sản phẩm</h3>
                <div className="flex gap-2">
                  {["all", "active", "ended"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setProductFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        productFilter === f
                          ? "bg-accent text-white"
                          : "border border-brand-border text-brand-text hover:bg-code-bg"
                      }`}
                    >
                      {f === "all" ? "Tất cả" : f === "active" ? "Đang chạy" : "Đã kết thúc"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border bg-brand-bg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-code-bg text-brand-text text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-semibold">ID</th>
                        <th className="px-4 py-3 font-semibold">Tên sản phẩm</th>
                        <th className="px-4 py-3 font-semibold">Giá hiện tại</th>
                        <th className="px-4 py-3 font-semibold">Lượt bid</th>
                        <th className="px-4 py-3 font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 font-semibold">Kết thúc</th>
                        <th className="px-4 py-3 font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-brand-text">
                            Không có sản phẩm nào.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="border-t border-brand-border hover:bg-code-bg/50">
                            <td className="px-4 py-3 text-brand-text">#{p.id}</td>
                            <td className="px-4 py-3 font-medium text-brand-h max-w-[200px] truncate">{p.title}</td>
                            <td className="px-4 py-3 text-red-500 font-bold">{p.current_price?.toLocaleString()} đ</td>
                            <td className="px-4 py-3 text-brand-text">{p.bid_count}</td>
                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3 text-brand-text text-xs whitespace-nowrap">{formatDate(p.end_time)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditProduct(p)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-accent border border-accent-border hover:bg-accent-bg transition"
                                >
                                  Sửa
                                </button>
                                {p.status === "active" && (
                                  <button
                                    type="button"
                                    onClick={() => handleCloseAuction(p)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-500 border border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                                  >
                                    Đóng
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Create product */}
          {activeTab === "create" && (
            <div>
              <h3 className="text-xl font-bold text-brand-h mb-6">Tạo phiên đấu giá mới</h3>
              <form onSubmit={handleCreateProduct} className="max-w-lg flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-brand-text block mb-1">Tên sản phẩm</label>
                  <input
                    type="text" required
                    placeholder="Ví dụ: MacBook Pro M4 16GB..."
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text block mb-1">Mô tả</label>
                  <textarea
                    rows={3} required
                    placeholder="Thông tin chi tiết sản phẩm..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-brand-text block mb-1">Giá khởi điểm (VNĐ)</label>
                    <input
                      type="number" required min={1000}
                      placeholder="25000000"
                      value={newProduct.start_price}
                      onChange={(e) => setNewProduct({ ...newProduct, start_price: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-brand-text block mb-1">Bước giá (VNĐ)</label>
                    <input
                      type="number" required min={1000}
                      placeholder="500000"
                      value={newProduct.step_price}
                      onChange={(e) => setNewProduct({ ...newProduct, step_price: e.target.value })}
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-text block mb-1">Thời gian đấu giá (giờ)</label>
                  <select
                    value={newProduct.duration_hours}
                    onChange={(e) => setNewProduct({ ...newProduct, duration_hours: e.target.value })}
                    className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="1">1 giờ</option>
                    <option value="3">3 giờ</option>
                    <option value="6">6 giờ</option>
                    <option value="12">12 giờ</option>
                    <option value="24">24 giờ</option>
                    <option value="48">48 giờ</option>
                    <option value="72">72 giờ</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-accent text-white font-bold rounded-xl text-base shadow-md hover:opacity-90 transition active:scale-95"
                >
                  🚀 Kích hoạt phiên đấu giá
                </button>
              </form>
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div>
              <h3 className="text-xl font-bold text-brand-h mb-6">Quản lý người dùng</h3>
              <div className="rounded-2xl border border-brand-border bg-brand-bg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-code-bg text-brand-text text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-semibold">ID</th>
                        <th className="px-4 py-3 font-semibold">Tài khoản</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Vai trò</th>
                        <th className="px-4 py-3 font-semibold">Lượt bid</th>
                        <th className="px-4 py-3 font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-brand-text">
                            Không có người dùng nào.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="border-t border-brand-border hover:bg-code-bg/50">
                            <td className="px-4 py-3 text-brand-text">#{u.id}</td>
                            <td className="px-4 py-3 font-medium text-brand-h">
                              {u.username}
                              {u.username === username && (
                                <span className="ml-1 text-xs text-accent">(bạn)</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-brand-text">{u.email}</td>
                            <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                            <td className="px-4 py-3 text-brand-text">{u.bid_count}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditUser(u)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-accent border border-accent-border hover:bg-accent-bg transition"
                                >
                                  Sửa
                                </button>
                                {u.username !== username && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRole(u)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-brand-border text-brand-h hover:bg-code-bg transition"
                                  >
                                    {u.role === "admin" ? "Hạ quyền" : "Cấp Admin"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal sửa sản phẩm */}
      {editingProduct && (
        <EditModal
          title={`Sửa sản phẩm #${editingProduct.id}`}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleSaveProduct}
        >
          <div>
            <label className={labelCls}>Tên sản phẩm</label>
            <input
              type="text" required
              value={editingProduct.title}
              onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea
              rows={3}
              value={editingProduct.description}
              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Giá khởi điểm (VNĐ)</label>
              <input
                type="number"
                value={editingProduct.start_price}
                disabled
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
              <p className="text-[11px] text-brand-text mt-1 m-0">Không đổi sau khi tạo</p>
            </div>
            <div>
              <label className={labelCls}>Bước giá (VNĐ)</label>
              <input
                type="number" required min={1000}
                value={editingProduct.step_price}
                onChange={(e) => setEditingProduct({ ...editingProduct, step_price: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Giá hiện tại (VNĐ)</label>
            <input
              type="number" required min={editingProduct.start_price}
              value={editingProduct.current_price}
              onChange={(e) => setEditingProduct({ ...editingProduct, current_price: e.target.value })}
              className={inputCls}
            />
            {editingProduct.bid_count > 0 && (
              <p className="text-[11px] text-amber-600 mt-1 m-0">
                Đã có {editingProduct.bid_count} lượt bid — cẩn thận khi chỉnh giá
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Thời gian kết thúc</label>
              <input
                type="datetime-local" required
                value={editingProduct.end_time}
                onChange={(e) => setEditingProduct({ ...editingProduct, end_time: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Trạng thái</label>
              <select
                value={editingProduct.status}
                onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                className={inputCls}
              >
                <option value="active">Đang diễn ra</option>
                <option value="ended">Đã kết thúc</option>
              </select>
            </div>
          </div>
        </EditModal>
      )}

      {/* Modal sửa người dùng */}
      {editingUser && (
        <EditModal
          title={`Sửa tài khoản: ${editingUser.username}`}
          onClose={() => setEditingUser(null)}
          onSubmit={handleSaveUser}
        >
          <div>
            <label className={labelCls}>Tên tài khoản</label>
            <input type="text" value={editingUser.username} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email" required
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Vai trò</label>
            <select
              value={editingUser.role}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              disabled={editingUser.username === username}
              className={`${inputCls} ${editingUser.username === username ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <option value="buyer">Buyer (Người mua)</option>
              <option value="admin">Admin (Quản trị)</option>
            </select>
            {editingUser.username === username && (
              <p className="text-[11px] text-brand-text mt-1 m-0">Không thể tự đổi quyền của mình</p>
            )}
          </div>
        </EditModal>
      )}
    </div>
  );
}
