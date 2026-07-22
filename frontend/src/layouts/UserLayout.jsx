import { useState } from "react";
import { Link, useNavigate, useLocation, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";
import { isActivePath } from "../utils/navigation";

const UserLayout = () => {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAdmin) {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }
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
      navigate(ROUTES.PUBLIC.LOGIN);
    }
  };

  const navLinks = [
    { to: ROUTES.USER.HOME, label: "🏠 Trang chủ" },
    { to: ROUTES.USER.ACCOUNT.DASHBOARD, label: "📊 Dashboard" },
    ...(!isAdmin
      ? [
          { to: ROUTES.USER.ACCOUNT.WALLET, label: "💳 Ví tiền" },
          { to: ROUTES.USER.ACCOUNT.WATCHLIST, label: "❤️ Yêu thích" }
        ]
      : []),
    ...(isSeller
      ? [{ to: ROUTES.SELLER.DASHBOARD, label: "🏪 Kênh bán", external: true }]
      : []),
    ...(isAdmin
      ? [{ to: ROUTES.ADMIN.DASHBOARD, label: "🛠️ Quản trị", external: true }]
      : []),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <nav
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={ROUTES.USER.HOME}
              className="text-xl font-bold"
              style={{ color: "var(--text-h)" }}
            >
              BID<span style={{ color: "var(--accent)" }}>PRO</span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
              👤 CLIENT PORTAL
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isActivePath(location.pathname, link.to)
                    ? "var(--accent)"
                    : "transparent",
                  color: isActivePath(location.pathname, link.to)
                    ? "#fff"
                    : "var(--text)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={ROUTES.USER.ACCOUNT.PROFILE}
              className="text-sm font-medium hidden sm:block hover:opacity-80 transition"
              style={{ color: "var(--text)" }}
            >
              👤 <span style={{ color: "var(--accent)" }}>{user?.username}</span>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-full transition text-base"
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--code-bg)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
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

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
