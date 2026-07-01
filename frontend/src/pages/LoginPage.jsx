import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts";

const LoginPage = () => {
  const { login, register } = useAuth();
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
        await login(form.username, form.password);
        navigate("/");
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

  const inputCls =
    "w-full p-3 rounded-xl border text-sm focus:outline-none transition";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--page-bg)" }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-xl border relative"
        style={{
          backgroundColor: "var(--surface-bg)",
          borderColor: "var(--border)",
        }}
      >
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-2 rounded-full transition text-xl"
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--code-bg)")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Logo & title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-h)" }}>
            BID<span style={{ color: "var(--accent)" }}>PRO</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
            {isRegisterMode ? "Tạo tài khoản mới" : "Đăng nhập vào hệ thống"}
          </p>
        </div>

        {/* Notification */}
        {notification.text && (
          <div
            className={`p-3 rounded-lg border text-sm font-medium mb-4 text-center ${alertCls}`}
          >
            {notification.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="username"
            type="text"
            placeholder="Tên tài khoản (username)..."
            required
            value={form.username}
            onChange={handleChange}
            className={inputCls}
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-bg)",
              color: "var(--text-h)",
            }}
          />

          {isRegisterMode && (
            <input
              name="email"
              type="email"
              placeholder="Địa chỉ Email..."
              required
              value={form.email}
              onChange={handleChange}
              className={inputCls}
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-bg)",
                color: "var(--text-h)",
              }}
            />
          )}

          <input
            name="password"
            type="password"
            placeholder="Mật khẩu..."
            required
            value={form.password}
            onChange={handleChange}
            className={inputCls}
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-bg)",
              color: "var(--text-h)",
            }}
          />

          {isRegisterMode && (
            <input
              name="confirm_password"
              type="password"
              placeholder="Xác nhận mật khẩu..."
              required
              value={form.confirm_password}
              onChange={handleChange}
              className={inputCls}
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-bg)",
                color: "var(--text-h)",
              }}
            />
          )}

          <button
            type="submit"
            disabled={notification.type === "loading"}
            className="w-full p-3 text-white font-bold rounded-xl text-base transition-all duration-200 shadow-md active:scale-95 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                notification.type === "loading" ? "#9ca3af" : "var(--accent)",
            }}
          >
            {isRegisterMode ? "🚀 Tạo tài khoản ngay" : "🔒 Đăng nhập"}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-4 space-y-2 text-center">
          <p
            onClick={() => {
              if (notification.type !== "loading") {
                setIsRegisterMode(!isRegisterMode);
                setNotification({ text: "", type: "" });
              }
            }}
            className="text-sm underline cursor-pointer hover:opacity-80 transition"
            style={{ color: "var(--accent)" }}
          >
            {isRegisterMode
              ? "Đã có tài khoản? Quay lại Đăng nhập"
              : "Chưa có tài khoản? Đăng ký tại đây"}
          </p>
          {!isRegisterMode && (
            <Link
              to="/forgot-password"
              className="block text-xs hover:opacity-80 transition"
              style={{ color: "var(--text)" }}
            >
              Quên mật khẩu?
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
