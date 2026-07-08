import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts";
import { ROUTES } from "../constants/routes";
import { getHomePathByRole } from "../utils/navigation";
import {
  Hammer,
  Shield,
  TrendingUp,
  Users,
  ArrowRight,
  Store,
  CheckCircle,
  HelpCircle,
  BarChart3,
  ChevronDown,
  Moon,
  Sun,
  Clock,
  Sparkles,
  ChevronRight,
  Terminal,
  Settings,
  Copy,
  FileText,
  Laptop,
  Diamond,
  Car,
  Key,
  Shirt,
  Search
} from "lucide-react";

const LandingPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  // Search Mock state
  const [searchVal, setSearchVal] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Simulated Live Auction Data for Landing Showcase
  const [mockProducts, setMockProducts] = useState([
    {
      id: 101,
      title: "Rolex Submariner Date 126610LN",
      description: "Đồng hồ Thụy Sĩ sang trọng, tình trạng mới 99% đầy đủ hộp sổ thẻ.",
      current_price: 365000000,
      bid_count: 24,
      timeLeft: 124, // in seconds
      imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=600&q=80",
      tag: "Xa xỉ"
    },
    {
      id: 102,
      title: "MacBook Pro M3 Max 16-inch 64GB/1TB",
      description: "Phiên bản cấu hình cực khủng cho lập trình viên và đồ họa chuyên nghiệp.",
      current_price: 88000000,
      bid_count: 17,
      timeLeft: 285, // in seconds
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
      tag: "Công nghệ"
    },
    {
      id: 103,
      title: "Bức tranh Sơn Dầu cổ điển Phố Cổ Hà Nội",
      description: "Tác phẩm độc bản của họa sĩ nổi tiếng năm 1998, có chứng nhận tác giả.",
      current_price: 45000000,
      bid_count: 8,
      timeLeft: 49, // in seconds
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80",
      tag: "Nghệ thuật"
    }
  ]);

  // Live Bid Ticker in Section 2 Terminal Mockup
  const [terminalBids, setTerminalBids] = useState([
    "✔ Connecting to BidPro WebSocket...",
    "✔ Verified buyer wallet deposit",
    "✔ Real-time bid: 88,200,000 đ",
    "Your auction is now active."
  ]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    setDarkMode(isDark);
  };

  // Copy command code
  const handleCopy = () => {
    navigator.clipboard.writeText("npm run start:bidpro-live");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Ticking timers for simulated auctions
  useEffect(() => {
    const interval = setInterval(() => {
      setMockProducts((prevProducts) =>
        prevProducts.map((p) => {
          if (p.timeLeft <= 0) return { ...p, timeLeft: 0 };
          return { ...p, timeLeft: p.timeLeft - 1 };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec) => {
    if (sec <= 0) return "⌛ Đã kết thúc";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}s`;
  };

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate(getHomePathByRole(user?.role));
    } else {
      navigate(ROUTES.PUBLIC.LOGIN);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      await logout();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f0] dark:bg-[#0b0f14] text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      
      {/* 1. Header Navigation Bar (Mô phỏng Thanh điều hướng mẫu) */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#f6f5f0]/85 dark:bg-[#0b0f14]/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-black tracking-wider flex items-center gap-1.5 text-slate-900 dark:text-white">
              <span className="p-1.5 bg-slate-950 text-white rounded-xl shadow-md">
                <Hammer className="w-5 h-5" strokeWidth={2} />
              </span>
              BID<span className="text-slate-900 dark:text-slate-350">PRO</span>
            </Link>
            <span className="hidden lg:inline-block px-2.5 py-0.5 text-[8.5px] font-black bg-slate-900 text-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-full">
              ĐỒ ÁN WEB
            </span>
          </div>
          
          {/* Pill navigation block in middle */}
          <div className="hidden md:flex items-center gap-1 px-1 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-250/70 dark:border-slate-800/80 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#auctions" className="px-4 py-2 rounded-full hover:bg-slate-150/60 dark:hover:bg-slate-800 transition">Sàn đấu giá</a>
            <a href="#portals" className="px-4 py-2 rounded-full hover:bg-slate-150/60 dark:hover:bg-slate-800 transition">Kênh bán</a>
            <a href="#features" className="px-4 py-2 rounded-full hover:bg-slate-150/60 dark:hover:bg-slate-800 transition">Giới thiệu</a>
            <a href="#faq" className="px-4 py-2 rounded-full hover:bg-slate-150/60 dark:hover:bg-slate-800 transition">Hướng dẫn</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Stars badge pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950 text-xs font-black shadow-md shadow-slate-950/10">
              <Hammer className="w-3.5 h-3.5 text-amber-400 animate-bounce" strokeWidth={2.5} />
              <span>54,741 phiên</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={getHomePathByRole(user?.role)}
                  className="bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  ⚡ Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="border border-red-500/30 hover:bg-red-500/10 text-red-500 text-xs font-bold px-3 py-2.5 rounded-xl transition"
                >
                  Rời đi
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.PUBLIC.LOGIN}
                className="bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold px-4.5 py-2.5 rounded-xl transition shadow-md"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Area (Tương ứng Ảnh 1) */}
      <section className="relative overflow-hidden pt-12 pb-24 md:py-32 bg-[#f6f5f0] dark:bg-[#0b0f14]">
        
        {/* Polaroid 1 (floating top-left, rotated -rotate-6) */}
        <div className="absolute top-12 left-10 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 pb-4 rounded shadow-lg w-36 transform -rotate-6 hidden lg:block animate-float z-20">
          <div className="aspect-square rounded overflow-hidden bg-slate-100 mb-2">
            <img src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] font-mono text-slate-500 block text-center">Rolex Submariner</span>
        </div>

        {/* Polaroid 2 (floating bottom-left near CTA, rotated rotate-6) */}
        <div className="absolute bottom-16 left-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 pb-4 rounded shadow-lg w-36 transform rotate-6 hidden lg:block animate-float z-20" style={{ animationDelay: "1.5s" }}>
          <div className="aspect-square rounded overflow-hidden bg-slate-100 mb-2">
            <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] font-mono text-slate-500 block text-center">Hanoi Painting</span>
        </div>

        {/* Polaroid 3 (floating top-right near browser mockup, rotated rotate-12) */}
        <div className="absolute top-16 right-[38%] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 pb-4 rounded shadow-lg w-36 transform rotate-12 z-20 hidden xl:block animate-float" style={{ animationDelay: "2.5s" }}>
          <div className="aspect-square rounded overflow-hidden bg-slate-100 mb-2">
            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] font-mono text-slate-500 block text-center">MacBook Pro M3</span>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Cột văn bản trái */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/60 dark:bg-orange-950/20 text-orange-850 dark:text-orange-400 text-xs font-bold tracking-wide border border-orange-200/40">
              <Sparkles className="w-4 h-4 text-orange-500" strokeWidth={2} />
              Phiên bản v2.0 (thời gian thực) vừa được phát hành. ➜
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white flex flex-wrap items-center justify-center lg:justify-start gap-y-2">
              Đấu giá 
              <span className="inline-flex items-center mx-2 w-16 h-8 sm:w-20 sm:h-10 rounded-full overflow-hidden border border-slate-350 dark:border-slate-850 shadow-inner shrink-0 transform -rotate-2">
                <img
                  src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=150&q=80"
                  alt="Rolex Submariner Inline"
                  className="w-full h-full object-cover"
                />
              </span>
              trực tuyến
            </h1>
            <p className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300 leading-tight">
              Sàn giao dịch thời gian thực chống nghẽn cho các phiên đấu
            </p>
            
            <p className="text-base font-bold text-orange-600 dark:text-orange-500 tracking-wide">
              Ít rườm rà hơn, chiến thắng nhanh hơn.
            </p>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Hệ thống đấu giá trực tuyến thời gian thực với độ trễ mili-giây, tích hợp nạp rút ví ký quỹ an toàn và bảo mật cao, kết nối trực tiếp Người mua, Người bán và hệ thống điều hành.
            </p>

            {/* Simulated terminal block command search */}
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono shadow-lg relative group">
                <span className="text-slate-500 select-none">$ </span>
                <input
                  type="text"
                  placeholder="npm run start:bidpro-live"
                  readOnly
                  className="bg-transparent text-slate-200 outline-none w-full ml-1 cursor-default font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition bg-slate-800/80 px-3 py-1 rounded-md border border-slate-700/60"
                >
                  {copySuccess ? "ĐÃ CHÉP" : "SAO CHÉP"}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={handleCTA}
                className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] text-sm"
              >
                Vào sàn đấu giá ngay 🔨
              </button>
              
              <Link
                to={ROUTES.PUBLIC.LOGIN}
                state={{ registerMode: true }}
                className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold px-8 py-3.5 rounded-xl transition text-sm text-center"
              >
                Trở thành người bán hàng. ➜
              </Link>
            </div>
          </div>
          
          {/* Cột thẻ ảnh lơ lửng bất đối xứng (Thiết kế bồng bềnh theo ảnh 1) */}
          <div className="lg:col-span-5 relative h-[450px] w-full hidden sm:block">
            
            {/* Card 1 - Rolex Watch (Top right / back) */}
            <div className="absolute top-2 right-4 w-60 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 transform rotate-3 hover:rotate-0 transition-all duration-500 z-10">
              <div className="h-32 rounded-xl overflow-hidden mb-2.5">
                <img
                  src={mockProducts[0].imageUrl}
                  alt={mockProducts[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] font-black text-amber-500 uppercase mb-0.5">{mockProducts[0].tag}</p>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{mockProducts[0].title}</h4>
              <p className="text-xs font-black text-red-500 mt-1">{mockProducts[0].current_price.toLocaleString()} đ</p>
            </div>

            {/* Card 2 - MacBook Pro Live (Center Left / front) */}
            <div className="absolute top-24 left-2 w-[280px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform -rotate-2 hover:rotate-0 transition-all duration-500 z-20">
              <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-3 justify-between select-none">
                <div className="flex gap-1 items-center">
                  <span className="w-2.5 h-2.5 bg-[#ff5f56] rounded-full inline-block"></span>
                  <span className="w-2.5 h-2.5 bg-[#ffbd2e] rounded-full inline-block"></span>
                  <span className="w-2.5 h-2.5 bg-[#27c93f] rounded-full inline-block"></span>
                </div>
                <span className="text-[8.5px] text-slate-500 font-mono">bidpro.vn/live</span>
              </div>
              <div className="p-4 space-y-3.5 bg-slate-950">
                <div className="relative h-28 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={mockProducts[1].imageUrl}
                    alt={mockProducts[1].title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60"></div>
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full animate-pulse z-10">
                    Live
                  </div>
                  <div className="text-center text-white relative z-10 space-y-0.5">
                    <p className="font-black text-[9px] tracking-wider text-violet-400 uppercase">ĐANG ĐẤU HOT</p>
                    <h5 className="font-bold text-xs line-clamp-1">{mockProducts[1].title}</h5>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-white">
                  <div>
                    <span className="text-[9px] text-slate-500 block">GIÁ HIỆN TẠI</span>
                    <span className="font-black text-red-500">{mockProducts[1].current_price.toLocaleString()}đ</span>
                  </div>
                  <button onClick={handleCTA} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded-lg text-[9px]">Đặt giá 🔨</button>
                </div>
              </div>
            </div>

            {/* Card 3 - Hanoi Painting (Bottom right / mid-ground) */}
            <div className="absolute bottom-6 right-2 w-60 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 transform rotate-1 hover:rotate-0 transition-all duration-500 z-15">
              <div className="h-32 rounded-xl overflow-hidden mb-2.5">
                <img
                  src={mockProducts[2].imageUrl}
                  alt={mockProducts[2].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] font-black text-orange-500 uppercase mb-0.5">{mockProducts[2].tag}</p>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{mockProducts[2].title}</h4>
              <p className="text-xs font-black text-red-500 mt-1">{mockProducts[2].current_price.toLocaleString()} đ</p>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Role Portals Walkthrough Section (Tương ứng Ảnh 2) */}
      <section id="portals" className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Cột văn bản trái */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <h2 className="text-4xl lg:text-5.5xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white">
              Hoạt động với <br />
              <span className="italic font-normal font-serif text-slate-700 dark:text-slate-350">mọi</span> vai trò.
            </h2>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Chỉ cần một lần đăng ký. Hỗ trợ Người mua (Bidder), Người bán (Seller) và Ban quản trị (Admin). Hệ thống BidPro tích hợp với bất kỳ quy chế giao dịch nào thông qua tệp cấu hình chuyên dụng.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={handleCTA}
                className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all text-sm"
              >
                Cài đặt tài khoản ngay ➔
              </button>
              
              <a
                href="#faq"
                className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold px-8 py-3.5 rounded-xl transition text-sm text-center"
              >
                Tài liệu hướng dẫn. ➜
              </a>
            </div>
          </div>

          {/* Khối đồ họa mô phỏng thiết kế UI hệ thống (Theo phong cách Ảnh 2) */}
          <div className="lg:col-span-6 relative h-[450px] w-full">
            
            {/* Terminal mock background */}
            <div className="absolute top-2 left-6 w-[280px] sm:w-[320px] bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-[10px] text-slate-200 z-10">
              <div className="h-7 bg-slate-900 border-b border-slate-800 flex items-center px-3 gap-1">
                <span className="w-2 h-2 bg-[#ff5f56] rounded-full inline-block"></span>
                <span className="w-2 h-2 bg-[#ffbd2e] rounded-full inline-block"></span>
                <span className="w-2 h-2 bg-[#27c93f] rounded-full inline-block"></span>
              </div>
              <div className="p-3.5 space-y-1.5 text-emerald-400">
                <p className="text-slate-500">$ npm run start:bidpro-live</p>
                {terminalBids.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            </div>

            {/* Design System UI overlay (Client Panel settings) */}
            <div className="absolute top-20 right-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3.5 z-20 space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">CLIENT SYSTEM</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Số dư ví</span>
                  <span className="font-bold text-violet-600">50M đ</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Phòng đấu</span>
                  <span className="font-bold text-emerald-600">Hoạt động</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Danh mục</span>
                  <span className="font-bold">Xa xỉ</span>
                </div>
              </div>
            </div>

            {/* 3D configurations blocks center (BIDPRO configuration) */}
            <div className="absolute bottom-6 left-12 w-[180px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-25 text-white space-y-2">
              <div className="flex items-center gap-1.5 text-amber-500">
                <FileText className="w-4 h-4" />
                <span className="font-bold text-xs font-mono">AUCTION.md</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal">
                Quy tắc bảo mật ví và bước giá thầu mẫu cho tác nhân AI & Client.
              </p>
            </div>

            {/* React Code sample overlay card */}
            <div className="absolute bottom-2 right-12 w-[160px] bg-slate-950 border border-slate-850 rounded-xl p-3 shadow-xl z-15 font-mono text-[9px] text-indigo-400">
              <p className="text-slate-500">// Button.tsx</p>
              <p className="text-slate-350">export function Button() &#123;</p>
              <p className="pl-2">const click = () =&gt; &#123;</p>
              <p className="pl-4 text-emerald-400">bidPro.placeBid(102);</p>
              <p className="pl-2">&#125;</p>
              <p className="text-slate-350">&#125;</p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Categories list bar (Tương ứng hàng 8 nút bấm Ảnh 2) */}
      <section id="auctions" className="py-16 max-w-7xl mx-auto px-6">
        <h3 className="text-center text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8">
          Các danh mục đấu giá tương thích
        </h3>
        
        {/* Row of 8 categories mockup tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { id: "01", name: "Xa xỉ", icon: <Clock className="w-4.5 h-4.5" strokeWidth={2} /> },
            { id: "02", name: "Công nghệ", icon: <Laptop className="w-4.5 h-4.5" strokeWidth={2} /> },
            { id: "03", name: "Nghệ thuật", icon: <PaintbrushIcon className="w-4.5 h-4.5" /> },
            { id: "04", name: "Trang sức", icon: <Diamond className="w-4.5 h-4.5" strokeWidth={2} /> },
            { id: "05", name: "Xe cộ", icon: <Car className="w-4.5 h-4.5" strokeWidth={2} /> },
            { id: "06", name: "Nhà đất", icon: <Key className="w-4.5 h-4.5" strokeWidth={2} /> },
            { id: "07", name: "Sưu tầm", icon: <FileText className="w-4.5 h-4.5" strokeWidth={2} /> },
            { id: "08", name: "Thời trang", icon: <Shirt className="w-4.5 h-4.5" strokeWidth={2} /> }
          ].map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span className="text-[9px] font-black text-slate-400 select-none block self-start">{cat.id}</span>
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-800 dark:text-slate-200 group-hover:scale-105 transition-transform">
                {cat.icon}
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-wide">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Core Platform Features Grid */}
      <section id="features" className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-[#fbfbfa]/50 dark:bg-[#0b0f14]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
              Giá Trị Cốt Lõi Của BidPro
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Được thiết kế dựa trên các công nghệ truyền tải dữ liệu tức thời và hệ thống bảo mật an ninh nhiều tầng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-850 rounded-xl flex items-center justify-center text-slate-900 dark:text-slate-200">
                <Clock className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Đấu Giá Tốc Độ Thực</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tốc độ cập nhật bảng đấu giá theo mili-giây, ngăn chặn tuyệt đối tình trạng trễ mạng ảnh hưởng đến kết quả đặt giá phút chót.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-850 rounded-xl flex items-center justify-center text-slate-900 dark:text-slate-200">
                <Shield className="w-5 h-5 text-indigo-650" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Bảo Mật Ký Quỹ An Toàn</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hệ thống ví điện tử tích hợp giúp đảm bảo người mua có đủ khả năng tài chính trước khi đấu giá, bảo vệ quyền lợi người bán.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-850 rounded-xl flex items-center justify-center text-slate-900 dark:text-slate-200">
                <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Biểu Đồ Phân Tích Trực Quan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hệ thống biểu đồ Recharts tích hợp sâu giúp trực quan hóa dữ liệu lịch sử đặt giá và kết quả chi tiêu kinh doanh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Live Auction Showcase (Popular products list) */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Các Sản Phẩm Đang Đấu Nổi Bật</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tham khảo một số vật phẩm có sức hút đặt giá lớn nhất hôm nay.</p>
          </div>
          <button
            onClick={handleCTA}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow"
          >
            Xem tất cả phiên
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mockProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                {/* Badge top */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {p.tag}
                  </span>
                  
                  <div className="flex items-center gap-1 text-xs text-red-500 font-bold">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> {formatTime(p.timeLeft)}
                  </div>
                </div>

                {/* Photo image cover */}
                <div className="h-44 rounded-xl mb-4 relative overflow-hidden group/img">
                   <img
                     src={p.imageUrl}
                     alt={p.title}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                   
                   {/* Hover Overlay Button */}
                   <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                     <span className="px-4 py-2 bg-white text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover/img:translate-y-0 transition-all duration-300 select-none">
                       🔨 Đấu giá ngay
                     </span>
                   </div>
                </div>

                <h3 className="font-bold text-lg line-clamp-1 mb-1 text-slate-900 dark:text-white">{p.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">{p.description}</p>
              </div>

              <div>
                <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-850/60 pt-4 mb-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">GIÁ HIỆN TẠI</span>
                    <span className="text-xl font-black text-red-500">{p.current_price.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">LƯỢT ĐẶT</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">🔨 {p.bid_count} lượt</span>
                  </div>
                </div>

                <button
                  onClick={handleCTA}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition shadow-md"
                >
                  Tham gia phòng đấu giá
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-900/10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Giải Đáp Thắc Mắc Thường Gặp</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tìm kiếm câu trả lời nhanh cho các hoạt động ký quỹ và quyền lợi các bên.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Làm thế nào để tôi có thể tham gia đặt giá trên hệ thống?",
                a: "Bạn cần tạo một tài khoản (User thường), đăng nhập và tiến hành nạp tiền vào ví cá nhân tại mục 'Ví tiền' để thực hiện đặt cọc/ký quỹ tối thiểu tùy theo điều kiện đặt ra của từng sản phẩm. Khi đó bạn sẽ được cấp quyền đấu giá trong phòng trực tiếp."
              },
              {
                q: "Quy chế ký quỹ của người bán (Seller) và sàn hoạt động ra sao?",
                a: "Người bán cần đăng tải sản phẩm với các thông tin chi tiết: giá khởi điểm, bước giá tối thiểu và thời gian kết thúc. Toàn bộ lượt đặt giá của khách hàng được ghi nhận công khai. Khi hết giờ, người trả giá cao nhất sẽ giành chiến thắng và hệ thống tự động khóa giao dịch để thực hiện đối soát vận chuyển."
              },
              {
                q: "Ban quản trị (Admin) kiểm duyệt hệ thống như thế nào?",
                a: "Admin kiểm duyệt hoạt động đăng bán sản phẩm của Seller, cấu hình danh sách Banner trang trí và kiểm soát danh mục hàng hóa. Hệ thống Admin Console cung cấp biểu đồ thống kê tăng trưởng người dùng và tổng quan doanh thu toàn sàn theo thời gian thực."
              }
            ].map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                    isOpen 
                      ? "bg-slate-50/50 dark:bg-slate-850/50 border-indigo-500/30"
                      : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800"
                  }`}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className={`w-full p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base transition-colors ${
                      isOpen
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "hover:bg-slate-50 dark:hover:bg-slate-850/40 text-slate-900 dark:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className={`w-5 h-5 shrink-0 transition-colors ${isOpen ? "text-indigo-500" : "text-slate-500"}`} />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-all duration-300 ${isOpen ? "rotate-180 text-indigo-500" : "text-slate-400"}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-black tracking-wider flex items-center gap-1.5 text-white">
              <span className="p-1.5 bg-white text-slate-950 rounded-xl shadow-md">
                <Hammer className="w-4 h-4" />
              </span>
              BIDPRO
            </Link>
            <p className="text-xs leading-relaxed">
              Dự án đồ án học phần Phát triển Ứng dụng Web. Nền tảng đấu giá trực tuyến chất lượng cao tích hợp công nghệ Realtime hiện đại.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Nhóm Phát Triển</h4>
            <ul className="space-y-2 text-xs">
              <li>Nguyễn Mai Minh Đạt - 2200000873</li>
              <li>Nguyễn Anh Khoa - 2200004825</li>
              <li>Phạm Nguyễn Nhật Sơn - 2200006700</li>
              <li>Phan Đức Anh - 2200004289</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Công Nghệ Sử Dụng</h4>
            <ul className="space-y-2 text-xs">
              <li>React 19 & React Router v6</li>
              <li>Tailwind CSS & Vanilla Variables</li>
              <li>FastAPI & SQLite Backend</li>
              <li>Recharts Visualizations</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Điều Khoản & Hỗ Trợ</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition">Quy chế hoạt động sàn</a></li>
              <li><a href="#" className="hover:text-white transition">Chính sách bảo mật thanh toán</a></li>
              <li><a href="#" className="hover:text-white transition">Giải quyết khiếu nại tranh chấp</a></li>
              <li><a href="#" className="hover:text-white transition">Liên hệ ban quản trị</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-800 text-center text-xs">
          <p>© {new Date().getFullYear()} BidPro - Đồ án tốt nghiệp môn Phát Triển Ứng Dụng Web. Bảo lưu mọi quyền.</p>
        </div>
      </footer>

    </div>
  );
};

// Helper internal component for PaintbrushIcon
function PaintbrushIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M7.5 10.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
      <path d="M11.5 7.5c.828 0 1.5-.672 1.5-1.5S12.328 4.5 11.5 4.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
      <path d="M16.5 9.5c.828 0 1.5-.672 1.5-1.5S17.328 6.5 16.5 6.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
      <path d="M6 14c0-2 2-3 4-3s4 1 4 3-2 3-4 3-4-1-4-3z" />
    </svg>
  );
}

export default LandingPage;
