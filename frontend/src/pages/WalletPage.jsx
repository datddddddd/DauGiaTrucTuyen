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

  const listBanks = [
    { id: "vietinbank", name: "VietinBank (TMCP Công thương Việt Nam)" },
    { id: "mbbank", name: "MB Bank (Ngân hàng Quân Đội)" },
    { id: "vietcombank", name: "Vietcombank (TMCP Ngoại Thương Việt Nam)" },
    { id: "techcombank", name: "Techcombank (TMCP Kỹ Thương Việt Nam)" },
    { id: "bidv", name: "BIDV (TMCP Đầu tư và Phát triển Việt Nam)" },
    { id: "acb", name: "ACB (Ngân hàng TMCP Á Châu)" },
  ];
  const [selectedBank, setSelectedBank] = useState({ id: "vietinbank", name: "VietinBank (TMCP Công thương Việt Nam)" });
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);

  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    payment_method: "VietQR",
    description: "",
  });

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/");
    } else {
      fetchWalletData();
    }
  }, [user, navigate]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleBankChange = (bankId) => {
    const bank = listBanks.find((b) => b.id === bankId);
    if (bank) {
      setQrLoading(true);
      setSelectedBank(bank);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`📋 Đã sao chép ${label}: ${text}`);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (transactionForm.payment_method === "VietQR") {
      setQrLoading(true);
      setShowQRModal(true);
    } else {
      setLoading(true);
      setMessage("");
      try {
        await walletService.deposit({
          ...transactionForm,
          amount: parseInt(transactionForm.amount),
          transaction_type: "deposit",
        });
        setMessage("Nạp tiền thành công!");
        setTransactionForm({ amount: "", payment_method: "VietQR", description: "" });
        fetchWalletData();
      } catch (error) {
        setMessage("Nạp tiền thất bại: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const confirmVietQRDeposit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const desc = transactionForm.description || `Nạp tiền VietQR cho thành viên ${user?.username || ""}`;
      await walletService.deposit({
        amount: parseInt(transactionForm.amount),
        payment_method: "VietQR",
        transaction_type: "deposit",
        description: `${desc} (Thụ hưởng: ${selectedBank.name})`,
      });
      setMessage("Yêu cầu nạp tiền VietQR đã được gửi và đang chờ Admin duyệt!");
      setShowQRModal(false);
      setTransactionForm({ amount: "", payment_method: "VietQR", description: "" });
      fetchWalletData();
    } catch (error) {
      setMessage("Gửi yêu cầu nạp tiền thất bại: " + error.message);
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
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`px-4 py-2 font-medium ${
                activeTab === "withdraw"
                  ? "text-accent border-b-2 border-accent"
                  : "text-brand-text"
              }`}
            >
              Rút tiền
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
                        {tx.description || tx.transaction_type}
                      </p>
                      <p className="text-sm text-brand-text">
                        {tx.payment_method} • {new Date(tx.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          tx.transaction_type === "deposit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.transaction_type === "deposit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-brand-text">
                        {tx.status === "completed"
                          ? "Hoàn thành"
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

          {(activeTab === "deposit" || activeTab === "withdraw") && (
            <form
              onSubmit={activeTab === "deposit" ? handleDeposit : handleWithdraw}
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
                  <option value="VietQR">Chuyển khoản VietQR</option>
                  <option value="VNPay">VNPay</option>
                  <option value="MoMo">MoMo</option>
                  <option value="Stripe">Stripe</option>
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
                  : activeTab === "deposit"
                  ? (transactionForm.payment_method === "VietQR" ? "Tạo mã QR Nạp tiền 💳" : "Nạp tiền")
                  : "Yêu cầu rút tiền"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* VietQR Deposit Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-slate-800 dark:text-white">
            
            {/* Left Column: QR Code Display */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-850 shrink-0 w-full md:w-72">
              <div className="relative w-56 h-72 flex items-center justify-center bg-white rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 p-2">
                {qrLoading && (
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 animate-pulse flex flex-col items-center justify-center text-[10px] text-slate-400 font-bold gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                    <span>Tạo mã VietQR...</span>
                  </div>
                )}
                <img
                  src={`https://img.vietqr.io/image/${selectedBank.id}-0835332997-compact2.png?amount=${transactionForm.amount}&addInfo=${encodeURIComponent("BIDPRO DEPOSIT " + (user?.username || ""))}&accountName=NGUYEN%20MAI%20MINH%20DAT`}
                  alt="VietQR Chuyển khoản"
                  onLoad={() => setQrLoading(false)}
                  className={`w-full h-auto object-contain transition-opacity duration-300 ${qrLoading ? "opacity-0" : "opacity-100"}`}
                />
              </div>
              <span className="text-[9px] text-slate-400 mt-3 font-medium text-center">Quét mã bằng ứng dụng ngân hàng của bạn</span>
            </div>

            {/* Right Column: Copyable Account Fields */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Thông Tin Nạp Tiền VietQR</h3>
                  <span className="text-[10px] bg-amber-100 text-amber-850 px-2 py-0.5 rounded font-bold">Chờ xử lý</span>
                </div>

                <div className="mb-4">
                  <label className="block text-[9px] text-slate-400 uppercase font-black mb-1">Chọn ngân hàng thụ hưởng</label>
                  <select
                    value={selectedBank.id}
                    onChange={(e) => handleBankChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-250 focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    {listBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Ngân hàng thụ hưởng</span>
                      <span className="text-slate-850 dark:text-slate-200">{selectedBank.name}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Số tài khoản</span>
                        <span className="text-slate-850 dark:text-slate-200 font-mono text-sm">0835332997</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("0835332997", "Số tài khoản")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Chủ tài khoản</span>
                        <span className="text-slate-850 dark:text-slate-200">NGUYEN MAI MINH DAT</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("NGUYEN MAI MINH DAT", "Chủ tài khoản")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Số tiền chuyển</span>
                        <span className="text-red-500 font-bold text-sm">{formatCurrency(parseInt(transactionForm.amount || 0))}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transactionForm.amount, "Số tiền")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Nội dung chuyển khoản</span>
                        <span className="text-slate-850 dark:text-slate-200 font-mono text-sm font-black">BIDPRO DEPOSIT {user?.username || ""}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`BIDPRO DEPOSIT ${user?.username || ""}`, "Nội dung chuyển khoản")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[10px] rounded font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={confirmVietQRDeposit}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Tôi đã chuyển khoản xong ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQRModal(false)}
                    className="px-4 py-2.5 border border-slate-350 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-500"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default WalletPage;