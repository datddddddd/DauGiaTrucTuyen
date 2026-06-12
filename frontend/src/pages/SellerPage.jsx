import { useState, useEffect } from "react";
import { productService, categoryService } from "../services";
import { useAuth } from "../contexts";

const SellerPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    start_price: "",
    step_price: "",
    duration_hours: "",
    images: "",
    condition: "new",
  });

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchMyProducts();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      // Filter products by seller_id
      const myProductsList = data.filter((p) => p.seller_id === user.id);
      setMyProducts(myProductsList);
    } catch (error) {
      console.error("Failed to fetch my products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await productService.createProduct({
        ...formData,
        start_price: parseInt(formData.start_price),
        step_price: parseInt(formData.step_price),
        duration_hours: parseInt(formData.duration_hours),
        images: formData.images ? formData.images.split(",").map((s) => s.trim()) : [],
      });
      setMessage("Đăng sản phẩm thành công!");
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        category_id: "",
        start_price: "",
        step_price: "",
        duration_hours: "",
        images: "",
        condition: "new",
      });
      fetchMyProducts();
    } catch (error) {
      setMessage("Đăng sản phẩm thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await productService.deleteProduct(productId);
      setMessage("Xóa sản phẩm thành công!");
      fetchMyProducts();
    } catch (error) {
      setMessage("Xóa thất bại: " + error.message);
    }
  };

  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-page-bg p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-brand-text">
            Bạn không có quyền truy cập trang này. Chỉ Seller và Admin mới có thể
            đăng sản phẩm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="border border-brand-border rounded-2xl p-6 bg-brand-bg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-brand-h">
              Quản lý sản phẩm của tôi
            </h1>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-accent text-white font-bold rounded-xl hover:opacity-90"
            >
              Đăng sản phẩm mới
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                message.includes("thành công")
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {loading ? (
            <p className="text-center text-brand-text py-8">Đang tải...</p>
          ) : myProducts.length === 0 ? (
            <p className="text-center text-brand-text py-8">
              Bạn chưa có sản phẩm nào. Hãy đăng sản phẩm đầu tiên!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-brand-border rounded-xl p-5 bg-brand-bg"
                >
                  <h3 className="font-semibold text-brand-h mb-2 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-sm text-brand-text mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-red-500 font-bold mb-2">
                    {product.current_price?.toLocaleString()} VNĐ
                  </p>
                  <p className="text-sm text-brand-text mb-4">
                    Trạng thái:{" "}
                    <span
                      className={`font-medium ${
                        product.status === "active"
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {product.status === "active" ? "Đang đấu giá" : "Đã kết thúc"}
                    </span>
                  </p>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="w-full py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                  >
                    Xóa sản phẩm
                  </button>
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-brand-bg rounded-2xl p-6 w-full max-w-2xl m-4">
                <h2 className="text-xl font-semibold text-brand-h mb-4">
                  Đăng sản phẩm mới
                </h2>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Tên sản phẩm *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Mô tả *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                      rows={4}
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Danh mục
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-h mb-1">
                        Giá khởi điểm (VNĐ) *
                      </label>
                      <input
                        type="number"
                        value={formData.start_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_price: e.target.value,
                          })
                        }
                        required
                        min="1000"
                        className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-h mb-1">
                        Bước giá (VNĐ) *
                      </label>
                      <input
                        type="number"
                        value={formData.step_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            step_price: e.target.value,
                          })
                        }
                        required
                        min="1000"
                        className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Thời gian đấu giá (giờ) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_hours: e.target.value,
                        })
                      }
                      required
                      min="1"
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      URL hình ảnh (ngăn cách bằng dấu phẩy)
                    </label>
                    <textarea
                      value={formData.images}
                      onChange={(e) =>
                        setFormData({ ...formData, images: e.target.value })
                      }
                      rows={2}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Tình trạng
                    </label>
                    <select
                      value={formData.condition}
                      onChange={(e) =>
                        setFormData({ ...formData, condition: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    >
                      <option value="new">Mới</option>
                      <option value="used">Đã sử dụng</option>
                      <option value="refurbished">Đã tân trang</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setFormData({
                          title: "",
                          description: "",
                          category_id: "",
                          start_price: "",
                          step_price: "",
                          duration_hours: "",
                          images: "",
                          condition: "new",
                        });
                      }}
                      className="flex-1 py-3 border border-brand-border text-brand-h rounded-xl hover:bg-code-bg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 disabled:bg-gray-400"
                    >
                      {loading ? "Đang đăng..." : "Đăng sản phẩm"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerPage;