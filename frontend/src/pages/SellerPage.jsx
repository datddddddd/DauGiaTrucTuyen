import { useState, useEffect } from "react";
import { useAuth } from "../contexts";
import axios from "axios"; 

const SellerPage = ({ setSelectedProduct, setCurrentView }) => {  
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_products: 0,
    active_auctions: 0,
    ended_auctions: 0,
    total_bids: 0
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  // State đóng/mở và quản lý dữ liệu Form đăng sản phẩm mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    category_id: 1,
    start_price: "",
    step_price: "",
    buy_now_price: "",
    duration_hours: 24,
    condition: "new",
    images: null 
  });

  // Hàm định dạng tiền tệ VND trực quan
  const formatVND = (amount) => {
    if (!amount && amount !== 0) return "0 đ";
    return Number(amount).toLocaleString("vi-VN") + " đ";
  };

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  const fetchSellerData = async () => {
  try {
    setLoading(true);
    setErrorText("");
    
    const token = localStorage.getItem("token");
    
    // Sử dụng axios thay vì fetch để đồng bộ cấu hình
    const response = await axios.get("http://127.0.0.1:8000/api/products", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    // Axios tự động parse JSON, nên data chính là response.data
    const data = response.data;
    
    if (Array.isArray(data)) {
      // Xác định ID người dùng an toàn
      const currentUserId = user?.id || user?.user?.id;
      
      // Lọc sản phẩm của người bán
      const myProducts = data.filter(p => p.seller_id === currentUserId);
      setProducts(myProducts);

      // Cập nhật thống kê
      setStats({
        total_products: myProducts.length,
        active_auctions: myProducts.filter(p => p.status === "active").length,
        ended_auctions: myProducts.filter(p => p.status === "ended").length,
        total_bids: myProducts.reduce((acc, p) => acc + (Number(p.bid_count) || 0), 0)
      });
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu:", error.response?.data || error.message);
    setErrorText("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  } finally {
    setLoading(false);
  }
};

  // Cập nhật giá trị khi người dùng nhập Form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

 const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData();
    
    // Đảm bảo các giá trị không bị thiếu
    formData.append("title", newProduct.title);
    formData.append("description", newProduct.description);
    // Đảm bảo category_id và condition được truyền đúng từ state
    formData.append("category_id", newProduct.category_id || 1); 
    formData.append("start_price", newProduct.start_price);
    formData.append("step_price", newProduct.step_price);
    formData.append("duration_hours", newProduct.duration_hours);
    formData.append("condition", newProduct.condition || "new");
    
    // Kiểm tra xem file có tồn tại không
    if (newProduct.images) {
        formData.append("file", newProduct.images);
    } else {
        alert("Vui lòng chọn hình ảnh sản phẩm!");
        setIsSubmitting(false);
        return;
    }

    try {
        await axios.post("http://127.0.0.1:8000/api/products", formData, {
            headers: { 
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        alert("🎉 Đăng sản phẩm thành công!");
        setShowCreateModal(false);
        fetchSellerData();
    } catch (error) {
        console.error("Lỗi chi tiết:", error.response?.data);
        alert("❌ Lỗi: " + JSON.stringify(error.response?.data?.detail || "Lỗi server"));
    } finally {
        setIsSubmitting(false);
    }
};

  if (loading && !errorText) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-white">
        <p className="text-xl font-semibold animate-pulse">🏪 Đang tải dữ liệu Kênh Người Bán...</p>
      </div>
    );
  }
const handleUpdateStatus = async (productId, newStatus) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://127.0.0.1:8000/api/products/${productId}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      alert("✅ Đã cập nhật trạng thái!");
      // Sau khi cập nhật thành công, gọi lại hàm lấy dữ liệu để bảng tự load lại
      // Lưu ý: Đảm bảo bạn đã có hàm fetchSellerData() hoặc tương tự để lấy danh sách sản phẩm
      if(typeof fetchSellerData === 'function') fetchSellerData();
      else window.location.reload(); // Cách nhanh nhất nếu chưa có hàm fetch
    } else {
      alert("❌ Lỗi khi cập nhật trạng thái.");
    }
  } catch (error) {
    console.error("Lỗi:", error);
  }
};


  return (
    <div className="min-h-screen bg-gray-900 p-6 text-gray-100">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">🏪 Kênh Quản Lý Người Bán</h1>
            <p className="text-sm text-gray-400">Xem và quản lý tất cả các mặt hàng đấu giá của bạn tại đây.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-md"
          >
            ➕ Đăng sản phẩm mới
          </button>
        </div>

        {/* Khối Thống kê nhanh */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 font-medium uppercase mb-1">📦 Tổng sản phẩm</p>
            <p className="text-xl font-bold text-white">{stats.total_products}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 font-medium uppercase mb-1">🔥 Đang đấu giá</p>
            <p className="text-xl font-bold text-green-400">{stats.active_auctions}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 font-medium uppercase mb-1">🏁 Đã kết thúc</p>
            <p className="text-xl font-bold text-gray-400">{stats.ended_auctions}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 font-medium uppercase mb-1">💬 Tổng lượt đặt giá</p>
            <p className="text-xl font-bold text-indigo-400">{stats.total_bids}</p>
          </div>
        </div>

        {/* Bảng Danh sách Sản phẩm */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <h3 className="font-semibold text-white text-base">📋 Danh sách sản phẩm của bạn ({products.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 text-xs font-semibold uppercase">
                  <th className="p-4 w-16">Hình ảnh</th>
                  <th className="p-4">Tên sản phẩm</th>
                  <th className="p-4">Giá khởi điểm</th>
                  <th className="p-4">Giá hiện tại</th>
                  <th className="p-4 text-center">Lượt đặt</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm text-gray-300">
  {products.length === 0 ? (
    <tr>
      <td colSpan="7" className="p-8 text-center text-gray-500">
        Bạn chưa đăng sản phẩm đấu giá nào. Bấm nút đăng ở trên để bắt đầu!
      </td>
    </tr>
  ) : (
    products.map((p) => (
      <tr key={p.id} className="hover:bg-gray-700/40 transition">
        <td className="p-4">
          <img
            src={
              p.images
                ? `http://127.0.0.1:8000${
                    p.images.startsWith("/") ? "" : "/"
                  }${p.images.replace(/\\/g, "/")}`
                : "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150"
            }
            alt={p.title}
            className="w-12 h-12 rounded-lg object-cover bg-gray-900 border border-gray-700"
          />
        </td>

        <td className="p-4">
          <div className="font-medium text-white max-w-xs truncate">
            {p.title}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            #{p.id}
          </div>
        </td>

        <td className="p-4 text-gray-400">
          {formatVND(p.start_price)}
        </td>

        <td className="p-4 text-indigo-400 font-semibold">
          {formatVND(p.current_price)}
        </td>

        <td className="p-4 text-center">
          {p.bid_count || 0}
        </td>

        <td className="p-4">
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              p.status === "active"
                ? "bg-green-900/40 text-green-400 border border-green-800"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {p.status === "active" ? "Đang chạy" : "Đã xong"}
          </span>
        </td>

        <td className="p-4 text-center">
          {p.status === "ended" ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleUpdateStatus(p.id, "confirmed")}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg w-full"
              >
                Xác nhận đơn
              </button>

              <button
                onClick={() => handleUpdateStatus(p.id, "shipping")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg w-full"
              >
                Giao hàng
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSelectedProduct(p);
                setCurrentView("home");
              }}
              className="text-indigo-400 hover:text-indigo-300 underline text-sm"
            >
              Xem chi tiết
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

        {/* FORM MODAL POPUP TẠO MỚI SẢN PHẨM */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/40">
                <h3 className="text-lg font-bold text-white">➕ Tạo Phiên Đấu Giá Mới</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    name="title"
                    value={newProduct.title}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: iPhone 15 Pro Max 256GB"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Mô tả sản phẩm</label>
                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả tình trạng máy, thông số kỹ thuật..."
                    rows="2"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Giá khởi điểm (VNĐ) *</label>
                    <input
                      type="number"
                      name="start_price"
                      value={newProduct.start_price}
                      onChange={handleInputChange}
                      placeholder="Mức giá khởi điểm"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Bước giá tối thiểu (VNĐ) *</label>
                    <input
                      type="number"
                      name="step_price"
                      value={newProduct.step_price}
                      onChange={handleInputChange}
                      placeholder="Mức tăng tối thiểu"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Thời gian đấu giá (Giờ)</label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={newProduct.duration_hours}
                      onChange={handleInputChange}
                      placeholder="Mặc định: 24 giờ"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Tình trạng máy</label>
                    <select
                      name="condition"
                      value={newProduct.condition}
                      onChange={handleInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    >
                      <option value="new">Hàng mới (New)</option>
                      <option value="used">Đã qua sử dụng (Like New)</option>
                    </select>
                  </div>
                </div>

                <div>
  <label className="block text-xs font-semibold uppercase text-brand-text mb-1">
    Hình ảnh sản phẩm (Tải từ Laptop) *
  </label>
  <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    if (e.target.files && e.target.files[0]) {
      setNewProduct(prev => ({
        ...prev,
        images: e.target.files[0] // Lưu file trực tiếp vào state
      }));
    }
  }}
  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white"
  required
/>
</div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 border border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-bold rounded-xl text-sm transition"
                  >
                    {isSubmitting ? "🚀 Đang đăng bài..." : "Đăng đấu giá"}
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

export default SellerPage;