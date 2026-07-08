import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";
import { isActivePath } from "../utils/navigation";

const sellerNav = [
  { to: ROUTES.SELLER.DASHBOARD, label: "📊 Tổng quan", icon: "📊" },
  { to: ROUTES.SELLER.PRODUCTS, label: "📦 Sản phẩm", icon: "📦" },
];

const SellerLayout = () => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900 hidden md:flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <Link to={ROUTES.SELLER.DASHBOARD} className="text-xl font-black tracking-wider text-white">
            BID<span className="text-indigo-400">PRO</span>
          </Link>
          <div className="inline-block mt-1 px-2.5 py-0.5 text-[9px] font-black bg-indigo-950 text-indigo-400 border border-indigo-850/60 rounded-full">
            🏪 SELLER COMMAND
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sellerNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActivePath(location.pathname, item.to)
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-350 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to={ROUTES.USER.HOME}
            className="block px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 transition font-bold"
          >
            🏠 Về sàn đấu giá
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-slate-800 transition font-bold"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6">
          <div className="md:hidden flex gap-2 overflow-x-auto">
            {sellerNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  isActivePath(location.pathname, item.to)
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400"
                }`}
              >
                {item.icon}
              </Link>
            ))}
          </div>
          <p className="text-sm text-slate-450 hidden md:block">
            Nhân viên kinh doanh: <span className="text-white font-bold">{user?.username}</span>
          </p>
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.USER.HOME}
              className="text-xs text-slate-450 hover:text-white transition font-bold"
            >
              Quay lại sàn đấu giá →
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
