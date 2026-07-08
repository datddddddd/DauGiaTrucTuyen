import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services";
import { ROUTES } from "../constants/routes";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: success
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-brand-border rounded-2xl p-8 bg-brand-bg">
        <h2 className="text-2xl font-semibold text-brand-h mb-6 text-center">
          {step === 1 && "Quên mật khẩu"}
          {step === 2 && "Nhập mã OTP"}
          {step === 3 && "Thành công!"}
        </h2>

        {message && (
          <div
            className={`p-3 rounded-lg mb-4 text-center ${
              message.includes("thành công") || message.includes("đã được gửi")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-h mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                placeholder="Nhập email của bạn"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 disabled:bg-gray-400"
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-h mb-1">
                Mã OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                placeholder="Nhập mã 6 số"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-h mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                placeholder="Ít nhất 6 ký tự"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-h mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                placeholder="Nhập lại mật khẩu"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 disabled:bg-gray-400"
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-brand-text">
              Mật khẩu của bạn đã được đặt lại thành công!
            </p>
            <button
              onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
              className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        <button
          onClick={() => navigate(ROUTES.PUBLIC.LOGIN)}
          className="w-full mt-4 text-sm text-brand-text hover:text-accent transition"
        >
          {step !== 3 && "Quay lại đăng nhập"}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;