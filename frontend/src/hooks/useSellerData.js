import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export function useSellerData() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_products: 0,
    active_auctions: 0,
    ended_auctions: 0,
    total_bids: 0,
    total_revenue: 0,
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const fetchSellerData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorText("");

      const token = localStorage.getItem("token");
      const currentUserId = user?.id || user?.user?.id;
      const response = await axios.get(`${API_URL}/products`, {
        params: { seller_id: currentUserId },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      if (Array.isArray(data)) {
        const myProducts = data;
        setProducts(myProducts);
        const endedProducts = myProducts.filter((p) => ["ended", "confirmed", "shipping", "completed", "delivered"].includes(p.status));
        const totalRevenue = endedProducts
          .filter((p) => p.bid_count > 0)
          .reduce((sum, p) => sum + p.current_price, 0);

        setStats({
          total_products: myProducts.length,
          active_auctions: myProducts.filter((p) => p.status === "active").length,
          ended_auctions: endedProducts.length,
          total_bids: myProducts.reduce(
            (acc, p) => acc + (Number(p.bid_count) || 0),
            0
          ),
          total_revenue: totalRevenue,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error.response?.data || error.message);
      setErrorText("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user, fetchSellerData]);

  return { stats, products, loading, errorText, fetchSellerData };
}
