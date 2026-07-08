import { useState, useEffect } from "react";
import { categoryService } from "../services";

const ProductFilters = ({ onFilterChange, onSortChange }) => {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category_id: "",
    min_price: "",
    max_price: "",
    search: "",
  });
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    onSortChange(value);
  };

  return (
    <div className="border border-brand-border rounded-xl p-4 bg-brand-bg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-brand-h mb-1">
            Tìm kiếm
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Tên sản phẩm..."
            className="w-full p-2 rounded-lg border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-brand-h mb-1">
            Danh mục
          </label>
          <select
            value={filters.category_id}
            onChange={(e) => handleFilterChange("category_id", e.target.value)}
            className="w-full p-2 rounded-lg border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Tất cả</option>
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

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-brand-h mb-1">
            Giá từ
          </label>
          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => handleFilterChange("min_price", e.target.value)}
            placeholder="VNĐ"
            className="w-full p-2 rounded-lg border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-h mb-1">
            Giá đến
          </label>
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => handleFilterChange("max_price", e.target.value)}
            placeholder="VNĐ"
            className="w-full p-2 rounded-lg border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-brand-h mb-1">
            Sắp xếp
          </label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full p-2 rounded-lg border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest_price">Giá cao nhất</option>
            <option value="lowest_price">Giá thấp nhất</option>
            <option value="ending_soon">Sắp kết thúc</option>
            <option value="most_bids">Lượt thầu nhiều nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;