import { Link } from "react-router-dom";
import { useSellerData } from "../../hooks/useSellerData";
import { ROUTES } from "../../constants/routes";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Package,
  Activity,
  Archive,
  MessageSquare,
  TrendingUp,
  CircleDollarSign,
  Plus
} from "lucide-react";

const SellerDashboardPage = () => {
  const { stats, products, loading, errorText } = useSellerData();

  if (loading && !errorText) {
    return (
      <div className="p-6 min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold animate-pulse text-indigo-400">📊 Đang tải tổng quan kênh bán...</p>
        </div>
      </div>
    );
  }

  if (errorText) {
    return (
      <div className="p-6 min-h-screen bg-slate-950 text-center text-red-400 flex items-center justify-center">
        <div className="space-y-4">
          <p className="text-lg">❌ {errorText}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Tổng sản phẩm",
      value: stats.total_products,
      border: "border-slate-800/80 hover:border-slate-700/80",
      text: "text-white",
      icon: <Package className="w-5 h-5 text-slate-450" strokeWidth={1.5} />
    },
    {
      label: "Đang đấu giá",
      value: stats.active_auctions,
      border: "border-slate-800/80 hover:border-indigo-500/20",
      text: "text-indigo-400",
      icon: <Activity className="w-5 h-5 text-indigo-450" strokeWidth={1.5} />
    },
    {
      label: "Đã kết thúc",
      value: stats.ended_auctions,
      border: "border-slate-800/80 hover:border-slate-700/80",
      text: "text-slate-400",
      icon: <Archive className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
    },
    {
      label: "Tổng lượt đặt giá",
      value: stats.total_bids,
      border: "border-slate-800/80 hover:border-violet-500/20",
      text: "text-violet-400",
      icon: <MessageSquare className="w-5 h-5 text-violet-450" strokeWidth={1.5} />
    }
  ];

  // Group ended products by month
  const monthlyRevenueMap = {};
  const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const currentMonth = new Date().getMonth();
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const m = (currentMonth - i + 12) % 12;
    last6Months.push(monthNames[m]);
    monthlyRevenueMap[monthNames[m]] = 0;
  }

  if (products && products.length > 0) {
    products.forEach((p) => {
      if (["ended", "confirmed", "shipping", "completed", "delivered"].includes(p.status) && p.bid_count > 0 && p.created_at) {
        const dateObj = new Date(p.created_at);
        const mName = monthNames[dateObj.getMonth()];
        if (monthlyRevenueMap[mName] !== undefined) {
          monthlyRevenueMap[mName] += p.current_price;
        }
      }
    });
  }

  const revenueChartData = Object.keys(monthlyRevenueMap).map(key => ({
    name: key,
    sales: monthlyRevenueMap[key]
  }));

  const formatRevenue = (val) => {
    return (val / 1000000).toFixed(1) + "M";
  };

  const progressPercent = Math.min((stats.total_revenue / 200000000) * 100, 100).toFixed(1);

  return (
    <div className="p-4 md:p-6 text-slate-100 bg-slate-950 min-h-screen font-sans animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              🏪 KÊNH NGƯỜI BÁN
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Quản lý sản phẩm đấu giá, theo dõi biến động thị trường và hiệu suất tài chính.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-black bg-slate-900 text-indigo-400 border border-slate-800 rounded-full uppercase tracking-wider">
              Seller Studio Active
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`bg-slate-900/60 rounded-2xl p-5 border ${card.border} transition-all duration-300 flex flex-col justify-between h-32`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">
                  {card.label}
                </span>
                {card.icon}
              </div>
              <p className={`text-3xl font-black tracking-tight ${card.text}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Action Panel and Target sales */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Revenue Chart Section */}
          <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Doanh thu đấu giá ước tính (VND)
              </h2>
              <span className="text-xs text-indigo-400 font-bold">Tổng: {stats.total_revenue?.toLocaleString("vi-VN")} đ</span>
            </div>
            
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatRevenue} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#818cf8" }}
                    formatter={(value) => [value.toLocaleString() + " đ", "Doanh thu"]}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Goal & Tools Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Sales Goal Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4 flex-1 justify-between flex flex-col">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                  Chỉ tiêu doanh số quý
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">Đạt 200,000,000 đ doanh số trước hạn chót ngày 30/09.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Tiến độ: {progressPercent}%</span>
                  <span>{(stats.total_revenue / 1000000).toFixed(1)}M / 200M</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Quick Link Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Quản lý kho hàng</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Đăng sản phẩm mới, chỉnh sửa trạng thái đấu giá, quản lý hồ sơ và bước giá sàn.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={ROUTES.SELLER.PRODUCTS}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs text-center transition shadow-md"
                >
                  📦 Xem sản phẩm
                </Link>
                <Link
                  to={ROUTES.SELLER.PRODUCTS}
                  state={{ openAddModal: true }}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-2.5 rounded-xl flex items-center justify-center transition border border-slate-700"
                  title="Thêm sản phẩm mới"
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default SellerDashboardPage;
