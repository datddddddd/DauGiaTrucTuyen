import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services";
import { ROUTES } from "../constants/routes";
import {
  Hammer,
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  Sun,
  Moon,
  ArrowLeft,
  Key
} from "lucide-react";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: success
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    setDarkMode(isDark);
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await authService.forgotPassword(email);
      setMessage("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    } catch (error) {
      setMessage("Gửi OTP thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu không khớp!");
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword({
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep(3);
    } catch (error) {
      setMessage("Đặt lại mật khẩu thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const alertCls =
    message.includes("thành công") || message.includes("đã được gửi")
      ? "bg-green-50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
      : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";

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
              BẢO MẬT & AN TOÀN TÀI KHOẢN
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Khôi phục mật khẩu <br />nhanh chóng & bảo mật.
            </h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Nhận mã OTP bảo mật qua Email đăng ký để xác minh danh tính và đặt lại mật khẩu mới chỉ trong vài giây.
            </p>
          </div>
        </div>

        {/* Bullet Trust indicators at bottom */}
        <div className="relative z-10 space-y-2 text-xs font-semibold text-slate-450">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            <span>Mã xác thực OTP có hiệu lực 5 phút</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            <span>Mã hóa mật khẩu đầu cuối tối tân</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            <span>Hỗ trợ khôi phục tài khoản 24/7</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Modern Form Panel */}
      <div className="w-full lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16 relative">
        
        {/* Dark mode & Back to login toggle */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <Link
            to={ROUTES.PUBLIC.LOGIN}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Đăng nhập
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
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-wider text-slate-900 dark:text-white lg:hidden mb-2">
              BIDPRO
            </h1>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {step === 1 && "Quên mật khẩu"}
              {step === 2 && "Xác thực mã OTP"}
              {step === 3 && "Đặt lại thành công"}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              {step === 1 && "Nhập email của bạn để nhận mã OTP khôi phục mật khẩu"}
              {step === 2 && `Nhập mã OTP 6 số đã gửi tới ${email} và mật khẩu mới`}
              {step === 3 && "Tài khoản của bạn đã được cập nhật mật khẩu mới thành công"}
            </p>
          </div>

          {/* Notification Alert */}
          {message && (
            <div className={`p-3 rounded-xl border text-xs font-semibold mb-5 text-center ${alertCls}`}>
              {message}
            </div>
          )}

          {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="Nhập địa chỉ email của bạn..."
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold rounded-xl text-sm transition-all duration-200 shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "⏳ Đang gửi mã OTP..." : "🚀 Gửi mã OTP"}
              </button>
            </form>
          )}

          {/* Step 2: Input OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              {/* OTP Code */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Nhập mã OTP 6 số..."
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white font-mono tracking-widest text-center"
                />
              </div>

              {/* New Password */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Mật khẩu mới (ít nhất 6 ký tự)..."
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                />
              </div>

              {/* Confirm New Password */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold rounded-xl text-sm transition-all duration-200 shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "⏳ Đang cập nhật..." : "🔒 Đặt lại mật khẩu"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-violet-600 hover:underline text-center font-bold mt-2"
              >
                Gửi lại mã OTP khác
              </button>
            </form>
          )}

          {/* Step 3: Success Screen */}
          {step === 3 && (
            <div className="text-center space-y-5 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-3xl">
                ✓
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại với thông tin mới.
              </p>
              <button
                onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold rounded-xl text-sm transition-all duration-200 shadow-md active:scale-98"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Bottom Back Option */}
          {step !== 3 && (
            <div className="mt-6 text-center">
              <Link
                to={ROUTES.PUBLIC.LOGIN}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default ForgotPasswordPage;