import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts";

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    setDarkMode(isDark);
  };

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      await logout();
      navigate("/login");
    }
  };

  const navLinks = [
    { to: "/", label: "🏠 Trang chủ" },
    { to: "/dashboard", label: "📊 Dashboard" },
    { to: "/wallet", label: "💳 Ví tiền" },
    { to: "/watchlist", label: "❤️ Yêu thích" },
    ...(isSeller || isAdmin ? [{ to: "/seller", label: "🏪 Seller" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "🛠️ Admin" }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      {/* Sticky Navbar */}
      <nav
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold shrink-0" style={{ color: "var(--text-h)" }}>
            BID<span style={{ color: "var(--accent)" }}>PRO</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor:
                    location.pathname === link.to ? "var(--accent)" : "transparent",
                  color:
                    location.pathname === link.to ? "#fff" : "var(--text)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/profile"
              className="text-sm font-medium hidden sm:block hover:opacity-80 transition"
              style={{ color: "var(--text)" }}
            >
              👤 <span style={{ color: "var(--accent)" }}>{user?.username}</span>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-full transition text-base"
              style={{ backgroundColor: "transparent" }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--code-bg)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-400 text-red-500 transition hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
