import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";
import { getHomePathByRole } from "../utils/navigation";
import {
  Hammer,
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Sun,
  Moon,
  ArrowLeft
} from "lucide-react";

const LoginPage = () => {
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [notification, setNotification] = useState({ text: "", type: "" });
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    setDarkMode(isDark);
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({
      text: isRegisterMode ? "⏳ Đang khởi tạo tài khoản..." : "⏳ Đang xác thực...",
      type: "loading",
    });

    try {
      if (isRegisterMode) {
        await register(form);
        setNotification({
          text: "🎉 Đăng ký thành công! Vui lòng đăng nhập.",
          type: "success",
        });
        setTimeout(() => {
          setIsRegisterMode(false);
          setForm({ username: "", email: "", password: "", confirm_password: "" });
          setNotification({ text: "", type: "" });
        }, 2000);
      } else {
        const response = await login(form.username, form.password);
        navigate(getHomePathByRole(response.role));
      }
    } catch (err) {
      setNotification({
        text: `❌ ${err.message || "Có lỗi xảy ra"}`,
        type: "error",
      });
    }
  };

  const alertCls =
    notification.type === "success"
      ? "bg-green-50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
      : notification.type === "error"
      ? "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
      : "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";

  if (isAuthenticated) {
    return <Navigate to={getHomePathByRole(user?.role)} replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#f6f5f0] dark:bg-[#0b0f14] transition-colors duration-300 font-sans">
      
      {/* LEFT COLUMN: Premium Design/Marketing Banner */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        
        {/* Glowing backdrop elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-violet-950/35 via-slate-950 to-slate-950 z-0"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-650/10 rounded-full blur-3xl z-0"></div>
        
        <div className="relative z-10">
          <Link to="/" className="text-xl font-black tracking-wider flex items-center gap-1.5 text-white">
            <span className="p-1.5 bg-white text-slate-950 rounded-xl shadow-md">
              <Hammer className="w-5 h-5" strokeWidth={2.2} />
            </span>
            BIDPRO
          </Link>
        </div>

        {/* Central Graphic Block */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-900/30 text-violet-400 text-[10px] font-bold tracking-wide border border-violet-850">
              <Sparkles className="w-3.5 h-3.5" />
              SÀN ĐẤU GIÁ THỜI GIAN THỰC
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Khởi đầu hành trình <br />đấu giá thông minh.
            </h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Trải nghiệm cơ chế đặt giá thầu tức thì với khả năng khớp lệnh mili-giây, bảo chứng ký quỹ và kiểm duyệt tối tân.
            </p>
          </div>

          {/* Interactive Bidding Card Mockup */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-2xl max-w-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Live bidding #102</span>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">04:45s</span>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Giá hiện tại</span>
                <span className="text-lg font-black text-red-500">88,200,000 đ</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Người đặt</span>
                <span className="text-xs font-bold text-slate-200">👤 anh_khoa22</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bullet Trust indicators at bottom */}
        <div className="relative z-10 space-y-2 text-xs font-semibold text-slate-450">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            <span>Đồng bộ hóa dữ liệu WebSocket thời gian thực</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            <span>Ký quỹ và thanh toán bảo chứng an toàn</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            <span>Phân quyền và bảo mật danh tính người bán</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Modern Form Panel */}
      <div className="w-full lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16 relative">
        
        {/* Dark mode & Back to home toggle */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Trang chủ
          </Link>
        </div>

        <button
          onClick={toggleDarkMode}
          className="absolute top-6 right-6 p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Card container */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250/70 dark:border-slate-800 p-8 rounded-2xl shadow-xl relative transition-all duration-300">
          
          {/* Logo representation on mobile */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-wider text-slate-900 dark:text-white lg:hidden">
              BIDPRO
            </h1>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {isRegisterMode ? "Tạo tài khoản mới" : "Chào mừng trở lại"}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              {isRegisterMode
                ? "Điền thông tin bên dưới để bắt đầu đăng bán & đặt giá thầu"
                : "Đăng nhập bằng tài khoản BidPro của bạn để tiếp tục"}
            </p>
          </div>

          {/* Notification Alert */}
          {notification.text && (
            <div className={`p-3 rounded-xl border text-xs font-semibold mb-5 text-center ${alertCls}`}>
              {notification.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Username Input */}
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                <User className="w-4 h-4" />
              </span>
              <input
                name="username"
                type="text"
                placeholder="Tên tài khoản (username)..."
                required
                value={form.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
              />
            </div>

            {/* Email Input (only in register) */}
            {isRegisterMode && (
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="Địa chỉ Email..."
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Password Input */}
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                <Lock className="w-4 h-4" />
              </span>
              <input
                name="password"
                type="password"
                placeholder="Mật khẩu..."
                required
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
              />
            </div>

            {/* Confirm Password Input (only in register) */}
            {isRegisterMode && (
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  name="confirm_password"
                  type="password"
                  placeholder="Xác nhận mật khẩu..."
                  required
                  value={form.confirm_password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={notification.type === "loading"}
              className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold rounded-xl text-sm transition-all duration-200 shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isRegisterMode ? "🚀 Tạo tài khoản ngay" : "🔒 Đăng nhập hệ thống"}
            </button>
          </form>

          {/* Switch Mode Option */}
          <div className="mt-5 space-y-2 text-center text-xs">
            <p
              onClick={() => {
                if (notification.type !== "loading") {
                  setIsRegisterMode(!isRegisterMode);
                  setNotification({ text: "", type: "" });
                }
              }}
              className="font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer transition select-none"
            >
              {isRegisterMode
                ? "Đã có tài khoản? Quay lại Đăng nhập"
                : "Chưa có tài khoản? Đăng ký tại đây"}
            </p>
            {!isRegisterMode && (
              <Link
                to={ROUTES.PUBLIC.FORGOT_PASSWORD}
                className="block font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition"
              >
                Quên mật khẩu?
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
