import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { categoryService } from "../../services";
import { useSellerData } from "../../hooks/useSellerData";
import { ROUTES } from "../../constants/routes";
import {
  Package,
  Activity,
  Archive,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  FileText,
  User,
  Image as ImageIcon
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://dau-gia-api.onrender.com/api";

const SellerProductsPage = () => {
  const navigate = useNavigate();
  const { products, loading, errorText, fetchSellerData } = useSellerData();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    category_id: "",
    start_price: "",
    step_price: "",
    buy_now_price: "",
    duration_hours: 24,
    condition: "new",
    images: null,
    imagePreview: ""
  });

  const [editProduct, setEditProduct] = useState({
    id: null,
    title: "",
    description: "",
    category_id: "",
    step_price: "",
    condition: "new",
    images: null,
    imagePreview: "",
    existingImage: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
      if (data && data.length > 0) {
        setNewProduct((prev) => ({ ...prev, category_id: data[0].id }));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const formatVND = (amount) => {
    if (!amount && amount !== 0) return "0 đ";
    return Number(amount).toLocaleString("vi-VN") + " đ";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Create Product Upload (with local machine preview)
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", newProduct.title);
    formData.append("description", newProduct.description);
    formData.append("category_id", newProduct.category_id || 1);
    formData.append("start_price", newProduct.start_price);
    formData.append("step_price", newProduct.step_price);
    formData.append("duration_hours", newProduct.duration_hours);
    formData.append("condition", newProduct.condition || "new");

    if (newProduct.images && newProduct.images.length > 0) {
      for (let i = 0; i < newProduct.images.length; i++) {
        formData.append("files", newProduct.images[i]);
      }
    } else {
      alert("Vui lòng chọn hình ảnh sản phẩm!");
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/products`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("🎉 Đăng bán và thiết lập phiên đấu giá thành công!");
      setShowCreateModal(false);
      setNewProduct({
        title: "",
        description: "",
        category_id: categories[0]?.id || 1,
        start_price: "",
        step_price: "",
        buy_now_price: "",
        duration_hours: 24,
        condition: "new",
        images: null,
        imagePreviews: []
      });
      fetchSellerData();
    } catch (error) {
      console.error("Lỗi chi tiết:", error.response?.data);
      alert("❌ Lỗi: " + JSON.stringify(error.response?.data?.detail || "Lỗi server"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal and load current data
  const handleOpenEditModal = (product) => {
    setEditProduct({
      id: product.id,
      title: product.title,
      description: product.description,
      category_id: product.category_id || 1,
      step_price: product.step_price,
      condition: product.condition || "new",
      images: null,
      imagePreview: "",
      existingImage: product.images
    });
    setShowEditModal(true);
  };

  // Update Product (supports uploading new image from local machine)
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", editProduct.title);
    formData.append("description", editProduct.description);
    formData.append("category_id", editProduct.category_id || 1);
    formData.append("step_price", editProduct.step_price);
    formData.append("condition", editProduct.condition || "new");

    if (editProduct.images && editProduct.images.length > 0) {
      for (let i = 0; i < editProduct.images.length; i++) {
        formData.append("files", editProduct.images[i]);
      }
    }

    try {
      await axios.put(`${API_URL}/products/${editProduct.id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("🎉 Cập nhật thông tin và lưu ảnh thành công!");
      setShowEditModal(false);
      fetchSellerData();
    } catch (error) {
      console.error("Lỗi cập nhật:", error.response?.data);
      alert("❌ Lỗi: " + JSON.stringify(error.response?.data?.detail || "Lỗi server"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product (only if bid_count is 0)
  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm chưa đấu giá này?")) {
      try {
        await axios.delete(`${API_URL}/products/${productId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        alert("🗑️ Đã xóa sản phẩm thành công!");
        fetchSellerData();
      } catch (error) {
        alert("❌ Lỗi khi xóa: " + (error.response?.data?.detail || "Lỗi server"));
      }
    }
  };

  // Re-list ended product
  const handleRelistProduct = async (productId) => {
    if (window.confirm("Bạn muốn đăng lại sản phẩm này với phiên đấu mới?")) {
      try {
        const response = await fetch(`${API_URL}/products/${productId}/relist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          alert("🔄 Đăng lại sản phẩm thành công!");
          fetchSellerData();
        } else {
          alert("❌ Không thể đăng lại sản phẩm.");
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Update order status
  const handleUpdateStatus = async (productId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/products/${productId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert(`✅ Trạng thái đơn hàng: ${newStatus === "confirmed" ? "Đã chuẩn bị hàng" : "Đang vận chuyển"}!`);
        fetchSellerData();
      } else {
        alert("❌ Lỗi khi cập nhật trạng thái đơn.");
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };
 
  const handleShipConfirm = async (productId) => {
    const shippingCode = prompt("Vui lòng nhập mã vận đơn để xác nhận giao hàng:");
    if (!shippingCode || !shippingCode.trim()) {
      alert("Bạn cần cung cấp mã vận đơn để thực hiện giao hàng!");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/products/${productId}/ship`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shipping_code: shippingCode.trim() }),
      });
      
      if (response.ok) {
        alert("🚚 Xác nhận giao hàng thành công! Mã vận đơn đã được gửi cho người mua.");
        fetchSellerData();
      } else {
        alert("❌ Lỗi khi xác nhận giao hàng.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi kết nối.");
    }
  };

  const openBidHistory = (product) => {
    setSelectedProduct(product);
    setShowBidHistoryModal(true);
  };

  if (loading && !errorText) {
    return (
      <div className="p-6 flex items-center justify-center text-white">
        <p className="text-sm font-semibold animate-pulse">📦 Đang tải danh sách hàng hóa...</p>
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="p-6 text-center text-red-400">
        <p>{errorText}</p>
      </div>
    );
  }

  const endedProducts = products.filter((p) => ["ended", "wait_confirm", "confirmed", "preparing", "shipping", "completed", "delivered"].includes(p.status) && p.bid_count > 0);

  return (
    <div className="p-4 md:p-6 text-slate-100 bg-slate-950 min-h-screen font-sans animate-fade-in space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              📦 QUẢN LÝ KHO HÀNG
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Đăng bán sản phẩm, theo dõi lượt bid trực tuyến và vận chuyển đơn hàng thắng giải.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md"
          >
            ➕ Đăng sản phẩm mới
          </button>
        </div>

        {/* Product Catalog Table */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              📋 Danh mục sản phẩm ({products.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-450 font-bold uppercase">
                  <th className="p-4 w-16">Ảnh</th>
                  <th className="p-4">Tên sản phẩm</th>
                  <th className="p-4">Giá khởi điểm</th>
                  <th className="p-4">Giá cao nhất (3.5)</th>
                  <th className="p-4 text-center">Lượt bid</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      Bạn chưa đăng sản phẩm đấu giá nào. Bấm nút đăng ở trên để bắt đầu!
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-4">
                        <img
                          src={
                            p.images
                              ? `https://dau-gia-api.onrender.com${
                                  p.images.startsWith("/") ? "" : "/"
                                 }${p.images.replace(/\\/g, "/")}`
                              : "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150"
                          }
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white max-w-xs truncate">{p.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{p.id}</div>
                      </td>
                      <td className="p-4 text-slate-450">{formatVND(p.start_price)}</td>
                      <td className="p-4 text-indigo-400 font-bold">
                        {formatVND(p.current_price)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openBidHistory(p)}
                          className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-850"
                        >
                          🔨 {p.bid_count || 0} lượt
                        </button>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            p.status === "active"
                              ? "bg-green-950 text-green-400 border border-green-900/50"
                              : "bg-slate-800 text-slate-450 border border-slate-700"
                          }`}
                        >
                          {p.status === "active" ? "Đang chạy" : "Đã dừng"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => navigate(ROUTES.USER.AUCTION(p.id))}
                          className="text-slate-400 hover:text-white"
                          title="Xem đấu giá"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>

                        {/* Edit Product (Sửa) - Allowed if bid_count is 0 */}
                        {(!p.bid_count || p.bid_count === 0) && (
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="text-amber-500 hover:text-amber-400"
                            title="Sửa sản phẩm"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                        )}

                        {/* Delete Product (Xóa) - Allowed if bid_count is 0 */}
                        {(!p.bid_count || p.bid_count === 0) && (
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-red-500 hover:text-red-400"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}

                        {/* Relist ended product */}
                        {p.status === "ended" && (!p.bid_count || p.bid_count === 0) && (
                          <button
                            onClick={() => handleRelistProduct(p.id)}
                            className="text-amber-500 hover:text-amber-400"
                            title="Đăng lại đấu giá"
                          >
                            <RefreshCw className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Shipping processing UI */}
        {endedProducts.length > 0 && (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/30">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                📦 Xử lý đơn hàng trúng đấu giá & Giao hàng (3.6)
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              {endedProducts.map((p) => (
                <div key={p.id} className="p-4 bg-slate-950 border border-slate-900 rounded-xl flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{p.title}</span>
                      <span className="text-[10px] text-slate-500">Mã: #{p.id}</span>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded font-bold uppercase"
                        style={{
                          backgroundColor:
                            p.status === "ended"
                              ? "rgba(245,158,11,0.1)"
                              : p.status === "wait_confirm"
                              ? "rgba(59,130,246,0.1)"
                              : p.status === "confirmed"
                              ? "rgba(20,184,166,0.1)"
                              : p.status === "preparing"
                              ? "rgba(16,185,129,0.1)"
                              : p.status === "shipping"
                              ? "rgba(99,102,241,0.1)"
                              : p.status === "delivered"
                              ? "rgba(249,115,22,0.1)"
                              : p.status === "completed"
                              ? "rgba(139,92,246,0.1)"
                              : "rgba(100,116,139,0.1)",
                          color:
                            p.status === "ended"
                              ? "#f59e0b"
                              : p.status === "wait_confirm"
                              ? "#3b82f6"
                              : p.status === "confirmed"
                              ? "#14b8a6"
                              : p.status === "preparing"
                              ? "#10b981"
                              : p.status === "shipping"
                              ? "#6366f1"
                              : p.status === "delivered"
                              ? "#f97316"
                              : p.status === "completed"
                              ? "#8b5cf6"
                              : "#64748b",
                        }}
                      >
                        {p.status === "ended"
                          ? "Đợi thanh toán"
                          : p.status === "wait_confirm"
                          ? "Chờ duyệt VietQR"
                          : p.status === "confirmed"
                          ? "Đã thanh toán (Chờ chuẩn bị)"
                          : p.status === "preparing"
                          ? "Đang chuẩn bị hàng"
                          : p.status === "shipping"
                          ? "Đang giao"
                          : p.status === "delivered"
                          ? "Đợi giải ngân"
                          : "Đơn hoàn tất"}
                      </span>
                    </div>
                    <p className="text-slate-450">
                      💰 Doanh thu thu hồi: <strong className="text-emerald-400">{formatVND(p.current_price)}</strong> | Lượt bid: {p.bid_count}
                    </p>
                    <p className="text-slate-500 font-semibold flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Người mua: <strong className="text-slate-300">{p.buyer_name || "Chưa có"}</strong>
                    </p>
                    {p.buyer_phone || p.buyer_address ? (
                      <div className="bg-slate-900/50 p-2.5 rounded-lg mt-1 border border-slate-850 space-y-1 text-slate-400 font-medium">
                        <p>📞 SĐT liên hệ: <strong className="text-slate-200">{p.buyer_phone}</strong></p>
                        <p>📍 Địa chỉ giao nhận: <strong className="text-slate-200">{p.buyer_address}</strong></p>
                      </div>
                    ) : (
                      <p className="text-red-500 font-bold mt-1">⚠️ Đang đợi khách hàng cập nhật SĐT & Địa chỉ giao hàng...</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 self-end sm:self-center">
                    {p.status === "ended" && (
                      <span className="text-amber-500 font-bold text-[10px]">Chờ người mua thanh toán</span>
                    )}
                    {p.status === "wait_confirm" && (
                      <span className="text-blue-500 font-bold text-[10px]">Chờ Admin duyệt VietQR</span>
                    )}
                    {p.status === "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus(p.id, "preparing")}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]"
                      >
                        Chuẩn bị hàng
                      </button>
                    )}
                    {p.status === "preparing" && (
                      <button
                        onClick={() => handleShipConfirm(p.id)}
                        className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px]"
                      >
                        Giao hàng (Nhập mã vận đơn)
                      </button>
                    )}
                    {p.status === "shipping" && (
                      <span className="text-indigo-400 font-bold text-[10px]">🚚 Đang giao (Mã: {p.shipping_code || "Chưa có"})</span>
                    )}
                    {p.status === "delivered" && (
                      <span className="text-orange-400 font-bold text-[10px]">⏳ Đợi Admin đối soát giải ngân ký quỹ</span>
                    )}
                    {p.status === "completed" && (
                      <span className="text-purple-400 font-bold text-[10px]">✅ Đã giải ngân (Hoàn tất giao dịch)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Product modal (with local machine preview support) */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">➕ Thiết lập phiên đấu giá mới</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-455 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="p-5 space-y-4 text-xs font-semibold text-slate-350">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newProduct.title}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Rolex Submariner Date..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Mô tả chi tiết *
                  </label>
                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    placeholder="Tình trạng máy, trầy xước, phụ kiện sổ thẻ đi kèm..."
                    rows="2.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Giá khởi điểm (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="start_price"
                      value={newProduct.start_price}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Bước giá tối thiểu (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="step_price"
                      value={newProduct.step_price}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Thời lượng đấu giá (Giờ)
                    </label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={newProduct.duration_hours}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Tình trạng vật phẩm
                    </label>
                    <select
                      name="condition"
                      value={newProduct.condition}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="new">Hàng mới 100% (New)</option>
                      <option value="used">Đã qua sử dụng (Used)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Danh mục sản phẩm *
                  </label>
                  <select
                    name="category_id"
                    value={newProduct.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  >
                    {categories.map((cat) => {
                      const prefix = cat.parent_id ? "  └─ " : "";
                      return (
                        <option key={cat.id} value={cat.id}>
                          {prefix}{cat.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Hình ảnh chụp sản phẩm (Chọn nhiều ảnh) *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setNewProduct((prev) => ({
                          ...prev,
                          images: files,
                          imagePreviews: files.map((file) => URL.createObjectURL(file))
                        }));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white mb-2"
                    required
                  />
                  {/* Local Machine Image Previews */}
                  {newProduct.imagePreviews && newProduct.imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newProduct.imagePreviews.map((prevUrl, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                          <img src={prevUrl} alt="Xem trước" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 rounded-xl text-xs hover:bg-slate-850 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    {isSubmitting ? "🚀 Đang thiết lập..." : "Đăng thầu đấu giá"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product modal (PUT Form-Data) */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">✏️ Chỉnh sửa thông tin sản phẩm</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-455 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="p-5 space-y-4 text-xs font-semibold text-slate-350">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editProduct.title}
                    onChange={handleEditInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Mô tả chi tiết *
                  </label>
                  <textarea
                    name="description"
                    value={editProduct.description}
                    onChange={handleEditInputChange}
                    rows="2.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Bước giá tối thiểu (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="step_price"
                      value={editProduct.step_price}
                      onChange={handleEditInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Tình trạng vật phẩm
                    </label>
                    <select
                      name="condition"
                      value={editProduct.condition}
                      onChange={handleEditInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="new">Hàng mới 100% (New)</option>
                      <option value="used">Đã qua sử dụng (Used)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Danh mục sản phẩm *
                  </label>
                  <select
                    name="category_id"
                    value={editProduct.category_id}
                    onChange={handleEditInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  >
                    {categories.map((cat) => {
                      const prefix = cat.parent_id ? "  └─ " : "";
                      return (
                        <option key={cat.id} value={cat.id}>
                          {prefix}{cat.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Hình ảnh chụp sản phẩm (Chọn file từ máy tính để thay đổi - chọn nhiều ảnh)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setEditProduct((prev) => ({
                          ...prev,
                          images: files,
                          imagePreviews: files.map((file) => URL.createObjectURL(file))
                        }));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white mb-2"
                  />
                  
                  {/* Current or New Image Preview */}
                  {editProduct.imagePreviews && editProduct.imagePreviews.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-[9px] text-slate-500 mb-1">Xem trước ảnh mới chọn từ máy tính:</p>
                      <div className="flex flex-wrap gap-2">
                        {editProduct.imagePreviews.map((prevUrl, index) => (
                          <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                            <img src={prevUrl} alt="Ảnh mới chọn" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : editProduct.existingImage ? (
                    <div className="mt-2">
                      <p className="text-[9px] text-slate-500 mb-1">Ảnh hiện tại:</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const cleaned = editProduct.existingImage.replace(/[\[\]'"\s]/g, "");
                          const imgUrls = cleaned.split(",").filter((x) => x);
                          return imgUrls.map((img, index) => (
                            <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                              <img
                                src={img.includes("http") ? img : `https://dau-gia-api.onrender.com${img.startsWith("/") ? "" : "/"}${img.replace(/\\/g, "/")}`}
                                alt="Ảnh hiện tại"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 border border-slate-800 rounded-xl text-xs hover:bg-slate-850 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    {isSubmitting ? "💾 Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bid History Log overlay modal */}
        {showBidHistoryModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">🔨 Lịch sử đấu giá (Realtime logs)</h3>
                  <p className="text-[10px] text-slate-455 mt-0.5">{selectedProduct.title}</p>
                </div>
                <button
                  onClick={() => setShowBidHistoryModal(false)}
                  className="text-slate-455 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto">
                {selectedProduct.bid_count > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-850">
                      <span className="font-bold text-white">👤 anh_khoa22</span>
                      <span className="font-black text-red-500">{formatVND(selectedProduct.current_price)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 opacity-60">
                      <span className="font-semibold text-slate-350">👤 minh_dat08</span>
                      <span className="font-bold text-slate-200">{formatVND(selectedProduct.current_price - selectedProduct.step_price || 2000000)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">Chưa có khách hàng nào tham gia đặt giá thầu cho phiên này.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SellerProductsPage;
