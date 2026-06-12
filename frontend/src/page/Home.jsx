import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, Gavel, Flame, Moon, Sun } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Giả lập gọi API lấy danh sách sản phẩm (Có Skeleton Loading)
  useEffect(() => {
    setTimeout(() => {
      setProducts([
        {
          id: 1,
          title: "Laptop Gaming Asus ROG Strix G16",
          description: "Core i7 Gen 13, RAM 16GB, RTX 4060, Màn hình 165Hz siêu mượt...",
          current_price: 25500000,
          end_time: "Còn 45 phút",
          bids_count: 12,
          image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=500&q=80",
          hot: true
        },
        {
          id: 2,
          title: "iPhone 15 Pro Max 256GB - Titan Tự Nhiên",
          description: "Máy quốc tế nguyên seal hộp, bảo hành chính hãng 12 tháng tại VN.",
          current_price: 29200000,
          end_time: "Còn 2 giờ",
          bids_count: 8,
          image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=500&q=80",
          hot: true
        },
        {
          id: 3,
          title: "Bàn phím cơ Custom Keychron Q1 Pro",
          description: "Full nhôm, Knob vặn, Switch Gateron Banana lướt cực êm tai.",
          current_price: 3500000,
          end_time: "Còn 5 giờ",
          bids_count: 19,
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80",
          hot: false
        }
      ]);
      setLoading(false);
    }, 1200); // Tạo độ trễ 1.2s để test hiệu ứng Skeleton
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      
      {/* 1. Header & Navigation */}
      <nav className={`sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-200'} backdrop-blur-md`}>
        <div className="flex items-center gap-2 font-bold text-2xl tracking-wide text-blue-600">
          <Gavel className="w-7 h-7 text-blue-500 animate-bounce" />
          <span>BID<span className="text-amber-500">PRO</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition">
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
          <button className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition">Đăng nhập</button>
        </div>
      </nav>

      {/* 2. Hero Banner Slideshow Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-12 shadow-xl">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-xs font-bold uppercase px-3 py-1 rounded-full mb-4 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> Sàn Đấu Giá Chuyên Nghiệp 2026
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Săn Hàng Chất - Giá Do Bạn Quyết!</h1>
            <p className="text-blue-100 mb-6 text-sm md:text-base">Hệ thống đấu giá thời gian thực bảo mật, minh bạch, chống giật gót giây cuối (Anti-Snipe).</p>
            <button className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow-lg">Khám phá ngay</button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none md:opacity-20">
            <Gavel className="w-96 h-96 transform translate-x-10 translate-y-10 rotate-12" />
          </div>
        </div>
      </div>

      {/* 3. Danh sách sản phẩm đấu giá */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="text-blue-500" /> Phiên Đấu Giá Đang Diễn Ra
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // HÀNG SKELETON LOADING (Khi đang đợi API trả về dữ liệu)
            [1, 2, 3].map((n) => (
              <div key={n} className={`rounded-2xl p-4 border animate-pulse ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="bg-gray-300 dark:bg-gray-700 h-48 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
              </div>
            ))
          ) : (
            // RENDER CARD SẢN PHẨM THỰC TẾ
            products.map((product) => (
              <div key={product.id} className={`group rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {/* Ảnh sản phẩm */}
                <div className="relative overflow-hidden aspect-video bg-gray-100">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {product.hot && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-white" /> HOT
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> {product.end_time}
                  </span>
                </div>

                {/* Nội dung thông tin */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-snug group-hover:text-blue-500 transition-colors line-clamp-1">{product.title}</h3>
                    <p className={`text-sm mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end">
                    <div>
                      <span className="text-xs block text-gray-400 uppercase font-semibold">Giá hiện tại</span>
                      <span className="text-xl font-black text-amber-500">{product.current_price.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block text-gray-400 font-medium">{product.bids_count} lượt đặt</span>
                      <button className="mt-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold text-sm px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        Ra Giá Ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}