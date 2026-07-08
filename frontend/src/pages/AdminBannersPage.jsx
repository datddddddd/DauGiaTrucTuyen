import { useState, useEffect } from "react";
import { bannerService } from "../services";

const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) return "";
  if (imgUrl.startsWith("http")) return imgUrl;
  const backendBase = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace("/api", "");
  return `${backendBase}${imgUrl}`;
};

const AdminBannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    is_active: true,
    order: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await bannerService.getBanners(false);
      setBanners(data);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      setMessage("Không thể tải danh sách banner!");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Vui lòng chọn hình ảnh từ máy tính!");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("link_url", formData.link_url);
      data.append("is_active", formData.is_active);
      data.append("order", formData.order);
      data.append("file", file);

      await bannerService.createBanner(data);
      setMessage("Tạo banner thành công!");
      setShowModal(false);
      setFormData({
        title: "",
        image_url: "",
        link_url: "",
        is_active: true,
        order: 0,
      });
      setFile(null);
      fetchBanners();
    } catch (error) {
      setMessage("Tạo thất bại: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("link_url", formData.link_url);
      data.append("is_active", formData.is_active);
      data.append("order", formData.order);
      if (file) {
        data.append("file", file);
      }

      await bannerService.updateBanner(editingBanner.id, data);
      setMessage("Cập nhật banner thành công!");
      setShowModal(false);
      setEditingBanner(null);
      setFormData({
        title: "",
        image_url: "",
        link_url: "",
        is_active: true,
        order: 0,
      });
      setFile(null);
      fetchBanners();
    } catch (error) {
      setMessage("Cập nhật thất bại: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) return;

    try {
      await bannerService.deleteBanner(bannerId);
      setMessage("Xóa banner thành công!");
      fetchBanners();
    } catch (error) {
      setMessage("Xóa thất bại: " + error.message);
    }
  };

  const handleToggleActive = async (bannerId, currentStatus) => {
    try {
      await bannerService.updateBanner(bannerId, { is_active: !currentStatus });
      setMessage("Cập nhật trạng thái thành công!");
      fetchBanners();
    } catch (error) {
      setMessage("Cập nhật thất bại: " + error.message);
    }
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      is_active: banner.is_active,
      order: banner.order,
    });
    setFile(null);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      image_url: "",
      link_url: "",
      is_active: true,
      order: 0,
    });
    setFile(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="border border-brand-border rounded-2xl p-6 bg-brand-bg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-brand-h">
              Quản lý Banner
            </h1>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-accent text-white font-bold rounded-xl hover:opacity-90"
            >
              Thêm Banner
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

          {loading && !banners.length ? (
            <p className="text-center text-brand-text py-8">Đang tải...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="border border-brand-border rounded-xl overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={resolveImageUrl(banner.image_url)}
                      alt={banner.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded ${
                          banner.is_active
                            ? "bg-green-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {banner.is_active ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-brand-h mb-2">
                      {banner.title}
                    </h3>
                    <p className="text-sm text-brand-text mb-4">
                      Thứ tự: {banner.order}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(banner.id, banner.is_active)}
                        className="flex-1 py-2 text-sm border border-brand-border text-brand-h rounded-lg hover:bg-code-bg"
                      >
                        {banner.is_active ? "Tắt" : "Bật"}
                      </button>
                      <button
                        onClick={() => openEditModal(banner)}
                        className="flex-1 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-brand-bg rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-brand-h mb-4">
                  {editingBanner ? "Cập nhật Banner" : "Tạo Banner mới"}
                </h2>
                <form
                  onSubmit={editingBanner ? handleUpdate : handleCreate}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Tiêu đề
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
                      Hình ảnh (Tải lên từ máy tính)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files[0])}
                      required={!editingBanner}
                      className="w-full p-2 border border-brand-border rounded-xl text-brand-h focus:outline-none focus:border-accent bg-brand-bg"
                    />
                    {editingBanner && (
                      <p className="text-[10px] text-brand-text mt-1">
                        Hiện tại: <span className="font-bold text-accent">{editingBanner.image_url}</span> (Để trống nếu giữ nguyên ảnh)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Thứ tự
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: parseInt(e.target.value) })
                      }
                      min="0"
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm text-brand-h">
                      Hoạt động
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingBanner(null);
                        setFormData({
                          title: "",
                          image_url: "",
                          link_url: "",
                          is_active: true,
                          order: 0,
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
                      {loading ? "Đang xử lý..." : "Lưu"}
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

export default AdminBannersPage;