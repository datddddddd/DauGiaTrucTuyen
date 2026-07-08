import { useState, useEffect } from "react";
import { categoryService } from "../services";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setMessage("Không thể tải danh sách danh mục!");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      };
      await categoryService.createCategory(payload);
      setMessage("Tạo danh mục thành công!");
      setShowModal(false);
      setFormData({ name: "", description: "", parent_id: "" });
      fetchCategories();
    } catch (error) {
      setMessage("Tạo thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      };
      await categoryService.updateCategory(editingCategory.id, payload);
      setMessage("Cập nhật danh mục thành công!");
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "", parent_id: "" });
      fetchCategories();
    } catch (error) {
      setMessage("Cập nhật thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;

    try {
      await categoryService.deleteCategory(categoryId);
      setMessage("Xóa danh mục thành công!");
      fetchCategories();
    } catch (error) {
      setMessage("Xóa thất bại: " + error.message);
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      parent_id: category.parent_id || "",
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", parent_id: "" });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="border border-brand-border rounded-2xl p-6 bg-brand-bg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-brand-h">
              Quản lý danh mục
            </h1>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-accent text-white font-bold rounded-xl hover:opacity-90"
            >
              Thêm danh mục
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

          {loading && !categories.length ? (
            <p className="text-center text-brand-text py-8">Đang tải...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left p-3 font-medium text-brand-h">ID</th>
                    <th className="text-left p-3 font-medium text-brand-h">Tên danh mục</th>
                    <th className="text-left p-3 font-medium text-brand-h">Mô tả</th>
                    <th className="text-left p-3 font-medium text-brand-h">
                      Số sản phẩm
                    </th>
                    <th className="text-left p-3 font-medium text-brand-h">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-brand-border">
                      <td className="p-3 text-brand-text">{category.id}</td>
                      <td className="p-3 font-medium text-brand-h">
                        {category.parent_id ? "  └─ " : ""}{category.name}
                      </td>
                      <td className="p-3 text-brand-text">
                        {category.description || "-"}
                      </td>
                      <td className="p-3 text-brand-text">
                        {category.product_count}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openEditModal(category)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg mr-2 hover:bg-blue-600"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-brand-bg rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-brand-h mb-4">
                  {editingCategory ? "Cập nhật danh mục" : "Tạo danh mục mới"}
                </h2>
                <form
                  onSubmit={editingCategory ? handleUpdate : handleCreate}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Tên danh mục
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Danh mục cha (Tùy chọn)
                    </label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) =>
                        setFormData({ ...formData, parent_id: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    >
                      <option value="">Không có (Danh mục gốc)</option>
                      {categories
                        .filter((c) => !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-h mb-1">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingCategory(null);
                        setFormData({ name: "", description: "", parent_id: "" });
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

export default AdminCategoriesPage;