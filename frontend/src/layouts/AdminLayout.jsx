import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";
import { isActivePath } from "../utils/navigation";

const adminNav = [
  { to: ROUTES.ADMIN.DASHBOARD, label: "📊 Dashboard" },
  { to: ROUTES.ADMIN.BANNERS, label: "🖼️ Banner" },
  { to: ROUTES.ADMIN.CATEGORIES, label: "📁 Danh mục" },
  { to: ROUTES.USER.ACCOUNT.PROFILE, label: "👤 Hồ sơ cá nhân" },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      await logout();
      navigate(ROUTES.PUBLIC.LOGIN);
    }
  };

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: "var(--page-bg)" }}>
      <aside
        className="w-64 shrink-0 border-r hidden md:flex flex-col text-slate-100"
        style={{ backgroundColor: "#0f172a", borderColor: "var(--border)" }}
      >
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Link to={ROUTES.ADMIN.DASHBOARD} className="text-xl font-black tracking-wider text-white">
            BID<span className="text-amber-400">PRO</span>
          </Link>
          <div className="inline-block mt-1 px-2.5 py-0.5 text-[9px] font-black bg-amber-950 text-amber-400 border border-amber-800/60 rounded-full">
            🛡️ SYSTEM CONTROL
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActivePath(location.pathname, item.to)
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-slate-800 transition font-bold"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 border-b flex items-center justify-between px-4 md:px-6"
          style={{ backgroundColor: "var(--surface-bg)", borderColor: "var(--border)" }}
        >
          <div className="md:hidden flex gap-2 overflow-x-auto">
            {adminNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  isActivePath(location.pathname, item.to)
                    ? "bg-amber-500 text-slate-950"
                    : "var(--text)"
                }`}
                style={
                  !isActivePath(location.pathname, item.to)
                    ? { color: "var(--text)" }
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-sm hidden md:block" style={{ color: "var(--text)" }}>
            Quản trị viên:{" "}
            <Link
              to={ROUTES.USER.ACCOUNT.PROFILE}
              style={{ color: "var(--amber-500)" }}
              className="text-amber-500 dark:text-amber-400 font-bold hover:underline"
            >
              {user?.username}
            </Link>
          </p>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
