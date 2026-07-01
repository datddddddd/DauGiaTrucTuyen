import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts";
import Layout from "../components/Layout";
import api from "../services/api";

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get("/products", { status: filter });
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProducts();
    // Auto-refresh mỗi 30s
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-h)" }}>
              ⚡ Sàn Đấu Giá Real-time
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
              Xin chào,{" "}
              <strong style={{ color: "var(--accent)" }}>{user?.username}</strong>!
              Chọn sản phẩm để tham gia đấu giá.
            </p>
          </div>

          {/* Status filter */}
          <div
            className="flex rounded-xl overflow-hidden border"
            style={{ borderColor: "var(--border)" }}
          >
            {["active", "ended"].map((s) => (
              <button
                key={s}
                onClick={() => { setFilter(s); setLoading(true); }}
                className="px-4 py-2 text-sm font-medium transition-all"
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
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
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
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        🔨 {item.bid_count} lượt
                      </span>
                    )}
                  </div>

                  <h3
                    className="text-lg font-semibold line-clamp-1 mb-2 transition-colors"
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
                        className="text-[11px] uppercase tracking-wider font-medium block"
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
                  onClick={() => navigate(`/auction/${item.id}`)}
                  disabled={item.status !== "active"}
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
            <p className="text-lg" style={{ color: "var(--text)" }}>
              {filter === "active"
                ? "Hiện không có phiên đấu giá nào đang diễn ra."
                : "Chưa có phiên đấu giá nào kết thúc."}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;
