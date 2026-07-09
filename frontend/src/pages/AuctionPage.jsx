import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BidHistory from "../BidHistory";
import WinDialog from "../components/WinDialog";
import { useWinDialog } from "../hooks/useWinDialog";
import { productService, watchlistService } from "../services";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../contexts";

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "wss://dau-gia-api.onrender.com";
const API_ORIGIN = (import.meta.env.VITE_API_URL || "https://dau-gia-api.onrender.com/api").replace(
  /\/api\/?$/,
  ""
);

const resolveImageUrl = (images) => {
  if (!images) return null;
  const cleaned = images.replace(/[\[\]'"\s]/g, "");
  if (cleaned.includes("http")) return cleaned;
  return `${API_ORIGIN}/${cleaned}`;
};

const AuctionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dialog, closeDialog, showAlert, showConfirm } = useWinDialog();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");
  const [historyBids, setHistoryBids] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  
  // Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("scam");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      alert("Vui lòng nhập nội dung báo cáo!");
      return;
    }
    setReporting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ORIGIN}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: parseInt(id),
          report_type: reportType,
          description: reportDescription
        })
      });
      if (response.ok) {
        alert("🎉 Báo cáo vi phạm đã được gửi đến Ban quản trị!");
        setShowReportModal(false);
        setReportDescription("");
      } else {
        const errorData = await response.json();
        alert("❌ Lỗi: " + (errorData.detail || "Không thể gửi báo cáo."));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi kết nối đến máy chủ.");
    } finally {
      setReporting(false);
    }
  };

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await productService.getProduct(id);
      setProduct(data);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setError("Không thể tải thông tin phiên đấu giá.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (id) {
      fetch(`${API_ORIGIN}/api/products/${id}/reviews`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setReviews(data))
        .catch(() => setReviews([]));
    }
  }, [id]);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user) return;
      try {
        const inWatchlist = await watchlistService.isInWatchlist(Number(id));
        setIsInWatchlist(inWatchlist);
      } catch (err) {
        console.error("Lỗi kiểm tra mục yêu thích:", err);
      }
    };
    if (user && id) {
      checkWatchlist();
    }
  }, [user, id]);

  const handleWatchlistToggle = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!");
      navigate(ROUTES.PUBLIC.LOGIN);
      return;
    }
    try {
      if (isInWatchlist) {
        await watchlistService.removeProductFromWatchlist(Number(id));
        setIsInWatchlist(false);
        setMessage("💔 Đã xóa khỏi danh sách yêu thích!");
      } else {
        await watchlistService.addToWatchlist(Number(id));
        setIsInWatchlist(true);
        setMessage("❤️ Đã thêm vào danh sách yêu thích!");
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ Lỗi: ${err.message || "Không thể thực hiện tác vụ"}`);
    }
  };

  useEffect(() => {
    if (!product) return;

    const calculateTimeLeft = () => {
      const endTime = product.end_time + (product.end_time.endsWith("Z") ? "" : "Z");
      const difference = new Date(endTime) - new Date();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [product]);

  useEffect(() => {
    if (!product) return;

    productService
      .getProductBids(product.id)
      .then((data) => setHistoryBids(Array.isArray(data) ? data : []))
      .catch(() => setHistoryBids([]));

    const ws = new WebSocket(`${WS_BASE_URL}/ws/auction/${product.id}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Number(data.product_id) !== Number(product.id)) return;

      if (data.event === "new_bid_delta") {
        setProduct((prev) => ({
          ...prev,
          current_price: data.current_price,
          end_time: data.end_time,
        }));
        setHistoryBids((prevBids) => [data.new_bid_history, ...prevBids]);
        setMessage(`📢 Hệ thống: [${data.latest_bidder}] vừa nâng giá lên thành công!`);
      }

      if (data.event === "product_updated") {
        setProduct((prev) => ({
          ...prev,
          title: data.title ?? prev.title,
          current_price: data.current_price ?? prev.current_price,
          end_time: data.end_time ?? prev.end_time,
          status: data.status ?? prev.status,
        }));
        setMessage("📢 Admin vừa cập nhật thông tin phiên đấu giá.");
      }

      if (data.event === "auction_ended_by_admin") {
        setProduct((prev) => ({
          ...prev,
          status: "ended",
          end_time: new Date().toISOString(),
        }));
        setMessage("⌛ Phiên đấu giá đã bị Admin đóng.");
      }
    };

    return () => ws.close();
  }, [product?.id]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "⌛ PHIÊN ĐẤU GIÁ ĐÃ KẾT THÚC";
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `⏱️ Còn lại: ${h}:${m}:${s}`;
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (user && product && product.seller_id === user.id) {
      showAlert({
        title: "Không khả dụng",
        message: "Bạn không thể tự đấu giá sản phẩm của chính mình!",
        variant: "warning",
      });
      return;
    }

    const inputAmount = parseInt(bidAmount, 10);
    const minAllowed = product.current_price + product.step_price;

    if (!inputAmount || inputAmount < minAllowed) {
      showAlert({
        title: "Giá không hợp lệ",
        message: `Bạn phải đặt tối thiểu là ${minAllowed.toLocaleString()} VNĐ.`,
        variant: "warning",
      });
      return;
    }

    const confirmed = await showConfirm({
      title: "Xác nhận đặt giá",
      message: `Bạn có chắc muốn đặt giá ${inputAmount.toLocaleString()} VNĐ cho "${product.title}"?`,
      variant: "warning",
      okText: "Đặt giá",
      cancelText: "Hủy",
    });
    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      const resData = await productService.placeBid({
        product_id: product.id,
        bid_amount: inputAmount,
      });

      showAlert({
        title: "Đặt giá thành công",
        message: resData.sniped
          ? "Anti-Sniping kích hoạt! Thời gian phòng đấu được cộng thêm 1 phút."
          : "Giá của bạn đã được ghi nhận thành công.",
        variant: "success",
      });
      setBidAmount("");
    } catch (error) {
      showAlert({
        title: "Đặt giá thất bại",
        message: error.message || "Có lỗi xảy ra khi đặt giá.",
        variant: "error",
      });
    } finally {
      setTimeout(() => setIsSubmitting(false), 1500);
    }
  };

  const renderReportModal = () => {
    if (!showReportModal) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-slate-100 text-xs">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-500">🚨 BÁO CÁO VI PHẠM SẢN PHẨM</h3>
            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
          </div>
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="block font-black text-slate-400 uppercase mb-1">Loại vi phạm *</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
              >
                <option value="scam">Lừa đảo / Gian lận</option>
                <option value="fake_item">Hàng giả / Sao chép</option>
                <option value="inappropriate">Nội dung không phù hợp</option>
                <option value="other">Lý do khác</option>
              </select>
            </div>
            <div>
              <label className="block font-black text-slate-400 uppercase mb-1">Nội dung chi tiết *</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
                placeholder="Vui lòng mô tả rõ hành vi vi phạm..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={reporting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
              >
                {reporting ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDialog = () =>
    dialog ? (
      <WinDialog
        open
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        okText={dialog.okText}
        cancelText={dialog.cancelText}
        showCancel={dialog.mode === "confirm"}
        onOk={() => {
          dialog.onConfirm?.();
          closeDialog();
        }}
        onCancel={() => {
          dialog.onCancel?.();
          closeDialog();
        }}
        onClose={() => {
          dialog.onCancel?.();
          closeDialog();
        }}
      />
    ) : null;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center" style={{ color: "var(--text)" }}>
        ⏳ Đang tải phòng đấu giá...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <p className="mb-4 text-red-500">{error || "Không tìm thấy sản phẩm."}</p>
        <button
          onClick={() => navigate(ROUTES.USER.HOME)}
          className="px-4 py-2 border rounded-xl text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-h)" }}
        >
          ⬅️ Trở về Trang chủ
        </button>
      </div>
    );
  }

  const minAllowed = product.current_price + product.step_price;
  
  let imageList = [];
  if (product && product.images) {
    try {
      const cleaned = product.images.replace(/[\[\]'"\s]/g, "");
      imageList = cleaned.split(",").filter((x) => x);
    } catch (e) {
      imageList = [product.images];
    }
  }
  if (imageList.length === 0) {
    imageList = ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60"];
  }

  return (
    <>
      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="col-span-1 md:col-span-3 flex justify-between items-center border-b pb-4 mb-2" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => navigate(ROUTES.USER.HOME)}
            className="px-4 py-2 border rounded-xl text-sm font-medium transition"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-bg)",
              color: "var(--text-h)",
            }}
          >
            ⬅️ Trở về Trang chủ
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleWatchlistToggle}
              className={`px-4 py-2 border rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                isInWatchlist
                  ? "border-red-500 text-red-500 font-bold"
                  : "border-slate-350 dark:border-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              style={{
                backgroundColor: isInWatchlist ? "rgba(239, 68, 68, 0.1)" : "var(--surface-bg)",
                borderColor: isInWatchlist ? "#ef4444" : "var(--border)",
              }}
            >
              {isInWatchlist ? "❤️ Đã yêu thích" : "🤍 Thêm yêu thích"}
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 border rounded-xl text-sm font-medium transition border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              🚨 Báo cáo vi phạm
            </button>
          </div>
        </div>

        <div
          className="md:col-span-2 border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--border)" }}
        >
          <div>
            <div className="mb-4">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: "var(--accent-bg)",
                  color: "var(--accent)",
                  borderColor: "var(--accent-border)",
                }}
              >
                ⚡ HỆ THỐNG ĐÃ XÁC THỰC (JWT)
              </span>
            </div>

            <div
              className="relative w-full max-w-md my-4 rounded-2xl overflow-hidden border flex flex-col items-center p-2 bg-[#030712]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="relative w-full h-64 flex justify-center items-center">
                <img
                  src={imageList[activeImageIndex].includes("http") ? imageList[activeImageIndex] : `${API_ORIGIN}/${imageList[activeImageIndex].replace(/^\//, "")}`}
                  alt={product.title}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60";
                  }}
                />
                {imageList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/75 transition text-sm font-black"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/75 transition text-sm font-black"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {imageList.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto w-full px-2 justify-center">
                  {imageList.map((imgUrl, index) => {
                    const resolvedThumb = imgUrl.includes("http") ? imgUrl : `${API_ORIGIN}/${imgUrl.replace(/^\//, "")}`;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition ${activeImageIndex === index ? "border-indigo-500" : "border-slate-800"}`}
                      >
                        <img src={resolvedThumb} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-h)" }}>
              {product.title}
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text)" }}>
              {product.description}
            </p>

            <h3
              className={`text-xl font-bold tracking-tight mb-4 ${
                timeLeft < 10 ? "text-red-500 animate-pulse" : "text-amber-500"
              }`}
            >
              {formatTime(timeLeft)}
            </h3>
            <hr className="my-4" style={{ borderColor: "var(--border)" }} />

            <span
              className="text-xs uppercase font-semibold tracking-wider block"
              style={{ color: "var(--text)" }}
            >
              Giá hiện hữu
            </span>
            <h3 className="text-3xl font-black text-red-500 my-1">
              {product.current_price?.toLocaleString()}{" "}
              <span className="text-lg">VNĐ</span>
            </h3>
            {user?.role !== "admin" && (
              <p className="text-xs mt-2" style={{ color: "var(--text)" }}>
                Bước giá tối thiểu:{" "}
                <span className="font-semibold" style={{ color: "var(--text-h)" }}>
                  +{product.step_price.toLocaleString()} VNĐ
                </span>
                . Yêu cầu nhập tối thiểu:{" "}
                <span className="text-green-500 font-bold">{minAllowed.toLocaleString()} VNĐ</span>
              </p>
            )}
          </div>

          {user?.role === "admin" ? (
            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs font-bold text-slate-500 dark:text-slate-400">
              🛡️ Bạn đang đăng nhập với tư cách Quản trị viên (Admin). Bạn không thể tham gia đấu giá! Các tính năng đấu giá đã bị ẩn.
            </div>
          ) : (
            <form onSubmit={handleBidSubmit} className="mt-8 flex gap-3">
              <input
                type="number"
                placeholder={product.seller_id === user?.id ? "Bạn là người đăng bán sản phẩm này..." : "Nhập số tiền muốn đấu giá..."}
                value={bidAmount}
                disabled={timeLeft <= 0 || isSubmitting || (product.seller_id === user?.id)}
                onChange={(e) => setBidAmount(e.target.value)}
                className="flex-1 p-3 rounded-xl border text-base focus:outline-none disabled:opacity-60 transition"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-bg)",
                  color: "var(--text-h)",
                }}
              />
              <button
                type="submit"
                disabled={timeLeft <= 0 || isSubmitting || (product.seller_id === user?.id)}
                className={`px-6 py-3 text-white font-bold rounded-xl text-base shadow-md transition-all duration-200 ${
                  isSubmitting || timeLeft <= 0 || (product.seller_id === user?.id)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 active:scale-95"
                }`}
              >
                {product.seller_id === user?.id 
                  ? "🚫 Không Thể Đấu Giá" 
                  : (isSubmitting ? "⌛ Đang ghi nhận..." : "🔨 Đặt Giá Cực Nhanh")}
              </button>
            </form>
          )}

          {message && (
            <p
              className={`mt-4 p-3 rounded-xl font-medium text-sm border ${
                message.includes("❌")
                  ? "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  : "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="col-span-1">
          <BidHistory bids={historyBids} />
        </div>

        {/* Reviews Section */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-h)" }}>💬 Đánh giá từ khách mua hàng</h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold text-center py-6">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: "var(--text-h)" }}>{rev.username}</span>
                      <span className="text-yellow-500 font-bold">{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{rev.created_at}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-350">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {renderDialog()}
      {renderReportModal()}
    </>
  );
};

export default AuctionPage;
