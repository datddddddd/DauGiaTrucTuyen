import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { walletService } from "../services";
import { formatCurrency } from "../utils";
import { useAuth } from "../contexts";

const WalletPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");

  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    payment_method: "VNPay",
    description: "",
  });

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/");
    } else {
      fetchWalletData();
      const interval = setInterval(() => {
        fetchWalletData(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, navigate]);

  const fetchWalletData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [walletData, transactionsData] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(),
      ]);
      setWallet(walletData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      setMessage("Không thể tải dữ liệu ví!");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`📋 Đã sao chép ${label}: ${text}`);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await walletService.deposit({
        ...transactionForm,
        amount: parseInt(transactionForm.amount),
        transaction_type: "deposit",
      });
      
      // Nếu là VNPay và backend trả về URL thanh toán, tiến hành chuyển hướng
      if (response && response.payment_url) {
        window.location.href = response.payment_url;
        return;
      }
      
      setMessage("Nạp tiền thành công!");
      setTransactionForm({ amount: "", payment_method: "VNPay", description: "" });
      fetchWalletData();
    } catch (error) {
      setMessage("Nạp tiền thất bại: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await walletService.withdraw({
        ...transactionForm,
        amount: parseInt(transactionForm.amount),
        transaction_type: "withdraw",
      });
      setMessage("Yêu cầu rút tiền đã được gửi!");
      setTransactionForm({ amount: "", payment_method: "VNPay", description: "" });
      fetchWalletData();
    } catch (error) {
      setMessage("Rút tiền thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !wallet) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-page-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="border border-brand-border rounded-2xl p-6 bg-brand-bg">
          <h1 className="text-2xl font-semibold text-brand-h mb-6">Ví của tôi</h1>

          {/* Balance Card */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
            <p className="text-sm opacity-90 mb-1">Số dư hiện tại</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-brand-border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium ${
                activeTab === "overview"
                  ? "text-accent border-b-2 border-accent"
                  : "text-brand-text"
              }`}
            >
              Lịch sử giao dịch
            </button>
            <button
              onClick={() => setActiveTab("deposit")}
              className={`px-4 py-2 font-medium ${
                activeTab === "deposit"
                  ? "text-accent border-b-2 border-accent"
                  : "text-brand-text"
              }`}
            >
              Nạp tiền
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                message.includes("thành công")
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-brand-text py-8">
                  Chưa có giao dịch nào
                </p>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-4 border border-brand-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-brand-h">
                        {tx.transaction_type === "Auction Payout" ? "Auction Payout" : (tx.description || tx.transaction_type)}
                      </p>
                      <p className="text-sm text-brand-text">
                        {tx.transaction_type === "Auction Payout" 
                          ? `Đơn hàng #AUC${tx.product_id ? String(tx.product_id).padStart(4, '0') : ''}` 
                          : tx.payment_method} • {new Date(tx.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          (tx.transaction_type === "deposit" || tx.transaction_type === "Auction Payout")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(tx.transaction_type === "deposit" || tx.transaction_type === "Auction Payout") ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-brand-text">
                        {tx.status === "completed"
                          ? (tx.transaction_type === "Auction Payout" ? "Đã giải ngân" : "Hoàn thành")
                          : tx.status === "pending"
                          ? "Đang xử lý"
                          : "Thất bại"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "deposit" && (
            <form
              onSubmit={handleDeposit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Số tiền (VNĐ)
                </label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, amount: e.target.value })
                  }
                  required
                  min="10000"
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Phương thức thanh toán
                </label>
                <select
                  value={transactionForm.payment_method}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                >
                  <option value="VNPay">VNPay Sandbox</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-h mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full p-3 rounded-xl border border-brand-border bg-brand-bg text-brand-h focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 disabled:bg-gray-400"
              >
                {loading
                  ? "Đang xử lý..."
                  : transactionForm.payment_method === "VNPay"
                  ? "Nạp tiền qua VNPAY 💳"
                  : "Nạp tiền"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;