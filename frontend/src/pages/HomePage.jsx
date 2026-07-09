import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts";
import api from "../services/api";
import { bannerService } from "../services";
import { ROUTES } from "../constants/routes";
import { Sparkles } from "lucide-react";
import ProductFilters from "../components/ProductFilters";

// 1. Array of Spotlight highlights that cycle automatically
const spotlightSlides = [
  {
    id: 101,
    title: "Đồng hồ Rolex Submariner Date 126610LN",
    description: "Chiêm ngưỡng tuyệt phẩm đồng hồ cơ khí cơ học Thụy Sĩ sang trọng, tình trạng mới 99% đầy đủ hộp sổ thẻ, đang thu hút 24 lượt thầu tham gia.",
    price: 365000000,
    imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=600&q=80",
    tag: "PHIÊN ĐẤU GIÁ NỔI BẬT TRONG TUẦN",
    actionId: 101
  },
  {
    id: 102,
    title: "MacBook Pro M3 Max 16-inch 64GB/1TB",
    description: "Phiên bản cấu hình cực khủng cho lập trình viên và nhà thiết kế chuyên nghiệp, độ mới tuyệt đối, hiệu năng đỉnh cao.",
    price: 88000000,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    tag: "CÔNG NGHỆ ĐỈNH CAO",
    actionId: 102
  },
  {
    id: 103,
    title: "Bức tranh Sơn Dầu cổ điển Phố Cổ Hà Nội",
    description: "Tác phẩm nghệ thuật sơn dầu độc bản của họa sĩ nổi tiếng năm 1998, mang giá trị văn hóa và sưu tầm đỉnh cao.",
    price: 45000000,
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80",
    tag: "NGHỆ THUẬT ĐỘC BẢN",
    actionId: 103
  }
];

const resolveImageUrl = (images) => {
  if (!images) return "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150";
  const cleaned = images.replace(/[\[\]'"\s]/g, "");
  const first = cleaned.split(",")[0];
  if (first.includes("http")) return first;
  return `https://dau-gia-api.onrender.com${first.startsWith("/") ? "" : "/"}${first}`;
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filters, setFilters] = useState({
    category_id: "",
    min_price: "",
    max_price: "",
    search: "",
  });
  const [sortBy, setSortBy] = useState("newest");
  const [searchParams, setSearchParams] = useSearchParams();

  // Load initial filter from URL or localStorage once on mount
  useEffect(() => {
    const categoryIdFromUrl = searchParams.get("category_id");
    const categoryIdFromStorage = localStorage.getItem("selected_category_id");

    let initialCategoryId = "";
    if (categoryIdFromUrl) {
      initialCategoryId = categoryIdFromUrl;
    } else if (categoryIdFromStorage) {
      initialCategoryId = categoryIdFromStorage;
      localStorage.removeItem("selected_category_id");
      setSearchParams({ category_id: categoryIdFromStorage });
    }

    if (initialCategoryId) {
      setFilters((prev) => ({
        ...prev,
        category_id: initialCategoryId,
      }));
    }
  }, []);

  // Fetch products from server
  const fetchProducts = useCallback(async () => {
    try {
      const params = {
        status: filter,
        category_id: filters.category_id || undefined,
        min_price: filters.min_price || undefined,
        max_price: filters.max_price || undefined,
        search: filters.search || undefined,
        sort: sortBy,
      };
      const data = await api.get("/products", params);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter, filters, sortBy]);

  const fetchBanners = useCallback(async () => {
    try {
      const data = await bannerService.getBanners(true);
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải banners:", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchBanners();
    const interval = setInterval(() => {
      fetchProducts();
      fetchBanners();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchProducts, fetchBanners]);

  // Construct slides to render (fallback to spotlightSlides if no db banners)
  const slidesToRender = banners.length > 0 ? banners.map(b => ({
    id: b.id,
    title: b.title,
    description: "Phiên đấu giá đặc biệt hoặc thông báo quan trọng từ Ban quản trị hệ thống.",
    price: 0,
    imageUrl: b.image_url.startsWith("http") ? b.image_url : `${(import.meta.env.VITE_API_URL || "https://dau-gia-api.onrender.com/api").replace("/api", "")}${b.image_url}`,
    tag: "THÔNG BÁO TỪ BAN QUẢN TRỊ",
    actionId: null
  })) : spotlightSlides;

  // Carousel timer: changes slides every 5 seconds
  useEffect(() => {
    if (slidesToRender.length <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesToRender.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [slidesToRender.length]);

  const formatTimeLeft = (endTime) => {
    const diff = new Date(endTime + (endTime.endsWith("Z") ? "" : "Z")) - new Date();
    if (diff <= 0) return "⌛ Đã kết thúc";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `⏱️ ${h}g ${m}p`;
    if (m > 0) return `⏱️ ${m}p ${s}s`;
    return `⚡ ${s}s`;
  };

  // Correct filter: Filter products locally in the UI to prevent mismatch
  const filteredProducts = products.filter((item) => {
    if (filter === "active") {
      return item.status === "active";
    } else {
      return item.status !== "active"; // includes ended, confirmed, shipping, delivered
    }
  });

  const activeSlide = slidesToRender[currentSlide] || slidesToRender[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white" style={{ color: "var(--text-h)" }}>
            ⚡ Sàn Đấu Giá Real-time
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text)" }}>
            Xin chào,{" "}
            <strong style={{ color: "var(--accent)" }}>{user?.username}</strong>!
            Chọn sản phẩm để tham gia đấu giá.
          </p>
        </div>

        {/* Status filter tabs */}
        <div
          className="flex rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {["active", "ended"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setLoading(true);
              }}
              className="px-4 py-2 text-xs font-bold transition-all"
              style={{
                backgroundColor:
                  filter === s ? "var(--accent)" : "var(--surface-bg)",
                color: filter === s ? "#fff" : "var(--text)",
              }}
            >
              {s === "active" ? "🟢 Đang đấu" : "🔴 Đã kết thúc"}
            </button>
          ))}
        </div>
      </div>

      {/* Spotlight Showcase Banner (LANDING SLIDESHOW BANNER FOR CATALOG) */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-xl min-h-[220px]">
        {/* Blur background highlights */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl z-0"></div>
        
        {/* Text Area with fade animation during change */}
        <div className="space-y-4 relative z-10 max-w-xl transition-all duration-500 ease-in-out">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-900/40 text-violet-400 text-[10px] font-bold tracking-wide border border-violet-850">
            <Sparkles className="w-3.5 h-3.5" />
            {activeSlide.tag}
          </span>
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            {activeSlide.title}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {activeSlide.description}
          </p>
          {activeSlide.price > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Giá thầu hiện tại</span>
                <span className="text-lg font-black text-red-500">
                  {activeSlide.price.toLocaleString("vi-VN")} đ
                </span>
              </div>
              {activeSlide.actionId && (
                <button
                  onClick={() => navigate(ROUTES.USER.AUCTION(activeSlide.actionId))}
                  className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] self-end"
                >
                  Tham gia đặt thầu ngay ➜
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right browser mockup graphic */}
        <div className="w-full md:w-56 shrink-0 relative z-10">
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="h-6 bg-slate-900 border-b border-slate-800 flex items-center px-2 gap-1 select-none">
              <span className="w-1.5 h-1.5 bg-[#ff5f56] rounded-full inline-block"></span>
              <span className="w-1.5 h-1.5 bg-[#ffbd2e] rounded-full inline-block"></span>
              <span className="w-1.5 h-1.5 bg-[#27c93f] rounded-full inline-block"></span>
            </div>
            <div className="h-32 bg-slate-950 flex items-center justify-center overflow-hidden relative">
              <img
                src={activeSlide.imageUrl}
                alt={activeSlide.title}
                className="w-full h-full object-cover transition-all duration-700 ease-in-out transform scale-100 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product filters */}
      <ProductFilters filters={filters} onFilterChange={setFilters} onSortChange={setSortBy} />

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl animate-pulse"
              style={{ backgroundColor: "var(--code-bg)" }}
            />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl p-5 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              style={{
                backgroundColor: "var(--surface-bg)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: item.status === "active"
                        ? "var(--accent-bg)"
                        : "rgba(239,68,68,0.1)",
                      color: item.status === "active"
                        ? "var(--accent)"
                        : "#ef4444",
                      borderColor: item.status === "active"
                        ? "var(--accent-border)"
                        : "rgba(239,68,68,0.3)",
                    }}
                  >
                    {item.status === "active" ? "🟢 Đang đấu giá" : "🔴 Đã kết thúc"}
                  </span>
                  {item.bid_count !== undefined && (
                    <span className="text-xs font-semibold text-slate-500">
                      🔨 {item.bid_count} lượt
                    </span>
                  )}
                </div>

                {/* Product Image Cover Preview */}
                <div className="h-40 rounded-xl mb-4 relative overflow-hidden group/img bg-slate-100 dark:bg-slate-800">
                  <img
                    src={resolveImageUrl(item.images)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                </div>

                <h3
                  className="text-base font-bold line-clamp-1 mb-2 transition-colors"
                  style={{ color: "var(--text-h)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-xs leading-relaxed line-clamp-2 mb-4"
                  style={{ color: "var(--text)" }}
                >
                  {item.description}
                </p>

                <div className="flex items-end justify-between">
                  <div>
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold block"
                      style={{ color: "var(--text)" }}
                    >
                      Giá hiện tại
                    </span>
                    <p className="text-xl font-black text-red-500 mt-0.5">
                      {item.current_price?.toLocaleString()}{" "}
                      <span className="text-sm font-normal">đ</span>
                    </p>
                  </div>
                  {item.end_time && (
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          new Date(item.end_time) - new Date() < 300000
                            ? "#ef4444"
                            : "var(--text)",
                      }}
                    >
                      {formatTimeLeft(item.end_time)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate(ROUTES.USER.AUCTION(item.id))}
                disabled={item.status !== "active" && item.status !== "ended"}
                className="mt-4 w-full py-2.5 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    item.status === "active" ? "var(--accent)" : "#6b7280",
                }}
              >
                {item.status === "active" ? "Vào phòng đấu giá 🔨" : "Đã kết thúc"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg text-slate-500">
            {filter === "active"
              ? "Hiện không có phiên đấu giá nào đang diễn ra."
              : "Chưa có phiên đấu giá nào kết thúc."}
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
