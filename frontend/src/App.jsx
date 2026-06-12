import { useEffect, useState, useCallback } from "react";
import BidHistory from './BidHistory';
import WinDialog from './components/WinDialog';
import AdminPanel from './components/AdminPanel';
import { useWinDialog } from './hooks/useWinDialog';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserDashboardPage from './pages/UserDashboardPage';

// --- CẤU HÌNH ĐƯỜNG DẪN TẬP TRUNG ---
const API_BASE_URL = "http://127.0.0.1:8000/api";
const WS_BASE_URL = "ws://127.0.0.1:8000";

function App() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [bidAmount, setBidAmount] = useState("");
    const [message, setMessage] = useState("");
    const [historyBids, setHistoryBids] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 1. CÁC STATE QUẢN LÝ ĐĂNG NHẬP / ĐĂNG KÝ THỰC TẾ ---
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [isAdminView, setIsAdminView] = useState(false);
    const isAdmin = userRole === "admin" || username === "admin";

    // View state for routing
    const [currentView, setCurrentView] = useState("home"); // home, dashboard, admin, profile, wallet, watchlist

    const [inputUsername, setInputUsername] = useState("");
    const [inputEmail, setInputEmail] = useState("");
    const [inputPassword, setInputPassword] = useState("");

    const [authNotification, setAuthNotification] = useState({ text: "", type: "" });
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
    const { dialog, closeDialog, showAlert, showConfirm } = useWinDialog();

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

    // --- 2. HÀM TẢI DANH SÁCH SẢN PHẨM (ĐÃ TỐI ƯU TRÁNH CRASH) ---
    const fetchProducts = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products`, { headers: { Authorization: `Bearer ${token}` }});
            if (!res.ok) throw new Error("Không thể lấy danh sách sản phẩm");
            const data = await res.json();
            // Phòng thủ: Đảm bảo dữ liệu nhận về luôn là một Mảng
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi Fetch Products:", err);
            setProducts([]); // Nếu lỗi, đưa về mảng rỗng thay vì sập web
        }
    }, [token]);



    // Tải danh sách sản phẩm khi vừa đăng nhập hoặc đổi token
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Đồng bộ role từ server mỗi khi có token
    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data?.role) {
                    localStorage.setItem("role", data.role);
                    setUserRole(data.role);
                }
            })
            .catch(() => {});
    }, [token]);


    // --- 3. LOGIC XỬ LÝ ĐĂNG NHẬP & ĐĂNG KÝ ---
    const handleAuthSubmit = async (e) => {
        e.preventDefault();

        setAuthNotification({
            text: isRegisterMode ? "⏳ Đang khởi tạo tài khoản, vui lòng đợi..." : "⏳ Đang xác thực thông tin...",
            type: "loading"
        });

        const url = isRegisterMode ? `${API_BASE_URL}/auth/register` : `${API_BASE_URL}/auth/login`;
        const bodyData = isRegisterMode
            ? { username: inputUsername, email: inputEmail, password: inputPassword }
            : { username: inputUsername, password: inputPassword };

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });
            const data = await res.json();

            if (!res.ok) {
                setAuthNotification({
                    text: `❌ Lỗi: ${data.detail || "Có lỗi xảy ra, vui lòng thử lại."}`,
                    type: "error"
                });
                return;
            }

            if (isRegisterMode) {
                setAuthNotification({
                    text: "🎉 Đăng ký tài khoản thành công! Đang chuyển hướng về Đăng nhập...",
                    type: "success"
                });

                setTimeout(() => {
                    setIsRegisterMode(false);
                    setInputEmail("");
                    setInputPassword("");
                    setAuthNotification({ text: "", type: "" });
                }, 2500);

            } else {
                setAuthNotification({ text: "🚀 Đăng nhập thành công! Chào mừng bạn quay trở lại.", type: "success" });

                setTimeout(() => {
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("username", data.username);
                    localStorage.setItem("role", data.role || "buyer");
                    setToken(data.access_token);
                    setUsername(data.username);
                    setUserRole(data.role || "buyer");

                    setInputUsername("");
                    setInputEmail("");
                    setInputPassword("");
                    setAuthNotification({ text: "", type: "" });
                }, 1500);
            }
        } catch (err) {
            setAuthNotification({ text: "❌ Không thể kết nối đến máy chủ Backend.", type: "error" });
        }
    };

    const handleLogout = async () => {
        const confirmed = await showConfirm({
            title: "Đăng xuất",
            message: "Bạn có chắc muốn đăng xuất khỏi hệ thống?",
            variant: "warning",
            okText: "Đăng xuất",
            cancelText: "Ở lại",
        });
        if (!confirmed) return;

        localStorage.clear();
        setToken("");
        setUsername("");
        setUserRole("");
        setSelectedProduct(null);
        setIsAdminView(false);
    };

    const toggleDarkMode = () => {
        const isDark = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
        setDarkMode(isDark);
    };

    // Bộ đếm ngược thời gian phòng đấu giá
    useEffect(() => {
        if (!selectedProduct) return;

        const calculateTimeLeft = () => {
            const difference = new Date(selectedProduct.end_time + (selectedProduct.end_time.endsWith("Z") ? "" : "Z")) - new Date();
            return difference > 0 ? Math.floor(difference / 1000) : 0;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedProduct]);

    // Lắng nghe WebSocket real-time
    useEffect(() => {
        if (!selectedProduct) return;

        // Lấy lịch sử giá ban đầu
        fetch(`${API_BASE_URL}/products/${selectedProduct.id}/bids`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setHistoryBids(Array.isArray(data) ? data : []));

        // Kết nối WebSocket lướt mượt mà
        const ws = new WebSocket(`${WS_BASE_URL}/ws/auction/${selectedProduct.id}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (Number(data.product_id) !== Number(selectedProduct.id)) return;

            if (data.event === "new_bid_delta") {
                setSelectedProduct(prev => ({
                    ...prev,
                    current_price: data.current_price,
                    end_time: data.end_time
                }));
                setHistoryBids(prevBids => [data.new_bid_history, ...prevBids]);
                setMessage(`📢 Hệ thống: [${data.latest_bidder}] vừa nâng giá lên thành công!`);
                fetchProducts();
            }

            if (data.event === "product_updated") {
                setSelectedProduct(prev => ({
                    ...prev,
                    title: data.title ?? prev.title,
                    current_price: data.current_price ?? prev.current_price,
                    end_time: data.end_time ?? prev.end_time,
                    status: data.status ?? prev.status,
                }));
                setMessage("📢 Admin vừa cập nhật thông tin phiên đấu giá.");
                fetchProducts();
            }

            if (data.event === "auction_ended_by_admin") {
                setSelectedProduct(prev => ({ ...prev, status: "ended", end_time: new Date().toISOString() }));
                setMessage("⌛ Phiên đấu giá đã bị Admin đóng.");
                fetchProducts();
            }
        };

        return () => ws.close();
    }, [selectedProduct, fetchProducts]);

    const formatTime = (seconds) => {
        if (seconds <= 0) return "⌛ PHIÊN ĐẤU GIÁ ĐÃ KẾT THÚC";
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `⏱️ Còn lại: ${h}:${m}:${s}`;
    };

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const inputAmount = parseInt(bidAmount);
        const minAllowed = selectedProduct.current_price + selectedProduct.step_price;

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
            message: `Bạn có chắc muốn đặt giá ${inputAmount.toLocaleString()} VNĐ cho "${selectedProduct.title}"?`,
            variant: "warning",
            okText: "Đặt giá",
            cancelText: "Hủy",
        });
        if (!confirmed) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/products/${selectedProduct.id}/bid`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // nếu hệ thống yêu cầu token đăng nhập
    },
    body: JSON.stringify({
        bid_amount: parseInt(bidAmount)
    })
});

            const resData = await response.json();
            if (!response.ok) {
                // Handle validation errors
                let errorMessage = "Có lỗi xảy ra khi đặt giá.";
                if (resData.detail) {
                    if (typeof resData.detail === 'string') {
                        errorMessage = resData.detail;
                    } else if (typeof resData.detail === 'object') {
                        errorMessage = resData.detail.msg || JSON.stringify(resData.detail);
                    }
                }
                showAlert({
                    title: "Đặt giá thất bại",
                    message: errorMessage,
                    variant: "error",
                });
            } else {
                showAlert({
                    title: "Đặt giá thành công",
                    message: resData.sniped
                        ? "Anti-Sniping kích hoạt! Thời gian phòng đấu được cộng thêm 1 phút."
                        : "Giá của bạn đã được ghi nhận thành công.",
                    variant: "success",
                });
                setBidAmount("");
            }
        } catch (error) {
            showAlert({
                title: "Lỗi kết nối",
                message: "Không thể kết nối đến máy chủ.",
                variant: "error",
            });
        } finally {
            setTimeout(() => setIsSubmitting(false), 1500);
        }
    };

    const minAllowed = selectedProduct ? selectedProduct.current_price + selectedProduct.step_price : 0;

    // --- DIỆN MẠO 1: CHƯA ĐĂNG NHẬP -> FORM AUTHENTICATION ---
    if (!token) {
        const getAlertClass = () => {
            if (authNotification.type === "success") return "bg-green-50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
            if (authNotification.type === "error") return "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
            return "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
        };

        return (
            <>
            <div className="min-h-screen bg-page-bg flex items-center justify-center p-6">
            <div className="w-full max-w-md p-8 border border-brand-border rounded-2xl shadow-xl bg-brand-bg text-left relative">
                <button onClick={toggleDarkMode} className="absolute top-4 right-4 p-2 rounded-full hover:bg-code-bg transition text-xl">
                    {darkMode ? "☀️" : "🌙"}
                </button>

                <h2 className="text-center font-medium text-brand-h mb-6">
                    {isRegisterMode ? "Đăng Ký Tài Khoản" : "Đăng Nhập Hệ Thống"}
                </h2>

                {authNotification.text && (
                    <div className={`p-3 rounded-lg border text-sm font-medium mb-4 text-center ${getAlertClass()}`}>
                        {authNotification.text}
                    </div>
                )}

                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Tên tài khoản (username)..."
                        required
                        value={inputUsername}
                        onChange={e => setInputUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent transition"
                    />

                    {isRegisterMode && (
                        <input
                            type="email"
                            placeholder="Địa chỉ Email..."
                            required={isRegisterMode}
                            value={inputEmail}
                            onChange={e => setInputEmail(e.target.value)}
                            className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent transition"
                        />
                    )}

                    <input
                        type="password"
                        placeholder="Mật khẩu..."
                        required
                        value={inputPassword}
                        onChange={e => setInputPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-sm focus:outline-none focus:border-accent transition"
                    />

                    <button
                        type="submit"
                        disabled={authNotification.type === "loading"}
                        className={`w-full p-3 text-white font-bold rounded-xl text-base transition-all duration-200 shadow-md ${
                            authNotification.type === "loading" 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-accent hover:opacity-90 active:scale-95"
                        }`}
                    >
                        {isRegisterMode ? "🚀 Tạo tài khoản ngay" : "🔒 Đăng nhập"}
                    </button>
                </form>

                <p
                    onClick={() => {
                        if (authNotification.type !== "loading") {
                            setIsRegisterMode(!isRegisterMode);
                            setAuthNotification({ text: "", type: "" });
                        }
                    }}
                    className="text-center text-accent text-sm mt-5 underline cursor-pointer hover:opacity-80 transition"
                >
                    {isRegisterMode ? "Đã có tài khoản? Quay lại Đăng nhập" : "Chưa có tài khoản? Đăng ký tại đây"}
                </p>
            </div>
            </div>
            {renderDialog()}
            </>
        );
    }

    // --- DIỆN MẠO 2: PHÒNG CHI TIẾT SẢN PHẨM ĐẤU GIÁ REAL-TIME ---
    if (selectedProduct) {
        return (
            <>
            <div className="min-h-screen bg-page-bg">
            <div className="w-full max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="col-span-1 md:col-span-3 flex justify-between items-center border-b border-brand-border pb-4 mb-2">
                    <button 
                        onClick={() => { setSelectedProduct(null); setMessage(""); }} 
                        className="px-4 py-2 border border-brand-border bg-brand-bg text-brand-h rounded-xl text-sm font-medium hover:bg-code-bg transition"
                    >
                        ⬅️ Trở về Trang chủ
                    </button>
                    <div className="flex items-center gap-4 text-sm text-brand-text">
                        <span>Xin chào, <strong className="text-accent">{username}</strong>!</span>
                        {isAdmin && (
                            <button
                                onClick={() => setIsAdminView(true)}
                                className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition shadow-sm"
                            >
                                Admin 🛠️
                            </button>
                        )}
                        <button onClick={toggleDarkMode} className="p-1.5 rounded-full hover:bg-code-bg transition text-base">
                            {darkMode ? "☀️" : "🌙"}
                        </button>
                        <button 
                            onClick={handleLogout} 
                            className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 border border-brand-border rounded-2xl p-6 bg-brand-bg shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="mb-4">
                            <span className="bg-accent-bg text-accent border border-accent-border text-xs font-bold px-3 py-1 rounded-full">
                                ⚡ HỆ THỐNG ĐÃ XÁC THỰC (JWT)
                            </span>
                        </div>

                        <h2 className="text-2xl font-semibold text-brand-h mb-2">{selectedProduct.title}</h2>
                        <p className="text-brand-text text-sm mb-6 leading-relaxed">{selectedProduct.description}</p>
                        
                        <h3 className={`text-xl font-bold tracking-tight mb-4 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                            {formatTime(timeLeft)}
                        </h3>
                        <hr className="border-brand-border my-4" />
                        
                        <span className="text-xs text-brand-text uppercase font-semibold tracking-wider block">Giá hiện hữu</span>
                        <h3 className="text-3xl font-black text-red-500 my-1">
                            {selectedProduct.current_price?.toLocaleString()} <span className="text-lg">VNĐ</span>
                        </h3>
                        <p className="text-xs text-brand-text mt-2">
                            Bước giá tối thiểu: <span className="font-semibold text-brand-h">+{selectedProduct.step_price.toLocaleString()} đ</span>. 
                            Yêu cầu nhập tối thiểu: <span className="text-green-500 font-bold">{minAllowed.toLocaleString()} đ</span>
                        </p>
                    </div>

                    <form onSubmit={handleBidSubmit} className="mt-8 flex gap-3">
                        <input
                            type="number"
                            placeholder="Nhập số tiền muốn đấu giá..."
                            value={bidAmount}
                            disabled={timeLeft <= 0 || isSubmitting}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="flex-1 p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h text-base focus:outline-none focus:border-accent disabled:bg-code-bg transition"
                        />
                        <button 
                            type="submit" 
                            disabled={timeLeft <= 0 || isSubmitting} 
                            className={`px-6 py-3 text-white font-bold rounded-xl text-base shadow-md transition-all duration-200 ${
                                isSubmitting || timeLeft <= 0
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-green-600 hover:bg-green-700 active:scale-95"
                            }`}
                        >
                            {isSubmitting ? "⌛ Đang ghi nhận..." : "🔨 Đặt Giá Cực Nhanh"}
                        </button>
                    </form>

                    {message && (
                        <p className={`mt-4 p-3 rounded-xl font-medium text-sm border ${
                            message.includes("❌") 
                            ? "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" 
                            : "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                        }`}>
                            {message}
                        </p>
                    )}
                </div>

                <div className="col-span-1">
                    <BidHistory bids={historyBids} />
                </div>
            </div>
            </div>
            {renderDialog()}
            </>
        );
    }

    // --- GIAO DIỆN ADMIN PANEL ---
    if (token && isAdmin && isAdminView) {
        return (
            <>
            <AdminPanel
                token={token}
                username={username}
                onBack={() => setIsAdminView(false)}
                onProductsChanged={fetchProducts}
                showAlert={showAlert}
                showConfirm={showConfirm}
            />
            {renderDialog()}
            </>
        );
    }

    // --- DIỆN MẠO 3: TRANG CHỦ DANH SÁCH SẢN PHẨM ---
    return (
        <>
        {/* Dashboard Views */}
        {currentView === "dashboard" && (
            <UserDashboardPage />
        )}

        {currentView === "admin" && isAdmin && (
            <AdminDashboardPage />
        )}

        {/* Home/Product View */}
        {currentView === "home" && (
            <div className="min-h-screen bg-page-bg">
            <div className="w-full max-w-5xl mx-auto p-6 text-left">
            {/* Header Sàn */}
            <div className="flex justify-between items-center mb-8 border-b border-brand-border pb-5">
                <h1 className="text-3xl font-medium tracking-tight text-brand-h m-0">
                    BID<span className="text-accent font-bold">PRO</span>
                </h1>
                <div className="flex items-center gap-3 text-sm text-brand-text">
                    <span>Xin chào, <strong className="text-accent">{username}</strong>!</span>

                    {/* User Dashboard Button */}
                    {token && (
                        <button
                            onClick={() => setCurrentView("dashboard")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-sm ${
                                currentView === "dashboard"
                                    ? "bg-blue-500 text-white"
                                    : "bg-brand-bg text-brand-h border border-brand-border hover:bg-code-bg"
                            }`}
                        >
                            Dashboard 📊
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => setCurrentView("admin")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-sm ${
                                currentView === "admin" || isAdminView
                                    ? "bg-amber-500 text-white"
                                    : "bg-amber-500 text-white hover:bg-amber-600"
                            }`}
                        >
                            Admin 🛠️
                        </button>
                    )}

                    <button onClick={toggleDarkMode} className="p-1.5 rounded-full hover:bg-code-bg transition text-base">
                        {darkMode ? "☀️" : "🌙"}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 text-xs border border-brand-border rounded-xl bg-brand-bg text-brand-h hover:bg-code-bg transition shadow-sm font-medium"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Grid danh sách sản phẩm - Đã bọc kiểm tra mảng an toàn tránh sập giao diện */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(products) && products.filter(p => p.status === "active").length > 0 ? (
                    products.filter(p => p.status === "active").map((item) => (
                        <div
                            key={item.id}
                            className="group border border-brand-border rounded-2xl p-5 bg-brand-bg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-brand-h group-hover:text-accent transition-colors line-clamp-1 mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-brand-text text-xs leading-relaxed line-clamp-2 h-8 mb-4">
                                    {item.description}
                                </p>
                                <span className="text-[11px] uppercase tracking-wider text-brand-text font-medium block">Giá hiện tại</span>
                                <p className="text-xl font-black text-red-500 mt-0.5 mb-4">
                                    {item.current_price?.toLocaleString()} <span className="text-sm font-normal">đ</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProduct(item)}
                                className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                            >
                                Vào phòng đấu giá 🔨
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-brand-text text-sm py-10">
                        📭 Hiện tại chưa có sản phẩm nào đang đấu giá.
                    </p>
                )}
            </div>
            </div>
            </div>
        )}
        {renderDialog()}
        </>
    );
}

export default App;