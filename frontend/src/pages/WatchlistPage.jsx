import { useState, useEffect } from "react";
import { watchlistService } from "../services";
import { formatCurrency, formatCountdown } from "../utils";

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const data = await watchlistService.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
      setMessage("Không thể tải danh sách yêu thích!");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (watchlistId) => {
    try {
      await watchlistService.removeFromWatchlist(watchlistId);
      setMessage("Đã xóa khỏi danh sách yêu thích!");
      fetchWatchlist();
    } catch (error) {
      setMessage("Xóa thất bại: " + error.message);
    }
  };

  const calculateTimeLeft = (endTime) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = Math.floor((end - now) / 1000);
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="border border-brand-border rounded-2xl p-6 bg-brand-bg">
          <h1 className="text-2xl font-semibold text-brand-h mb-6">
            Danh sách yêu thích
          </h1>

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

          {watchlist.length === 0 ? (
            <p className="text-center text-brand-text py-8">
              Bạn chưa có sản phẩm nào trong danh sách yêu thích
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="border border-brand-border rounded-xl p-5 bg-brand-bg hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-brand-h mb-2 line-clamp-1">
                    {item.product_title}
                  </h3>
                  <p className="text-sm text-brand-text mb-4">
                    Giá hiện tại:{" "}
                    <span className="text-red-500 font-bold">
                      {formatCurrency(item.current_price)}
                    </span>
                  </p>
                  {item.end_time && (
                    <p className="text-sm text-brand-text mb-4">
                      Thời gian còn lại:{" "}
                      <span className="font-medium text-brand-h">
                        {formatCountdown(calculateTimeLeft(item.end_time))}
                      </span>
                    </p>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="w-full py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                  >
                    Xóa khỏi danh sách
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistPage;