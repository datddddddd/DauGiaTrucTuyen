import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { formatCurrency } from "../utils";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Home } from "lucide-react";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState({
    status: "",
    amount: 0,
    txnRef: "",
    responseCode: "",
    message: "",
  });

  useEffect(() => {
    const status = searchParams.get("status") || "";
    const amount = parseInt(searchParams.get("amount") || "0", 10);
    const txnRef = searchParams.get("txn_ref") || "";
    const responseCode = searchParams.get("response_code") || "";
    const message = searchParams.get("message") || "";

    setPaymentInfo({
      status,
      amount,
      txnRef,
      responseCode,
      message,
    });
  }, [searchParams]);

  const isSuccess = paymentInfo.status === "SUCCESS";
  const isFailed = paymentInfo.status === "FAILED";
  const isProcessing = !isSuccess && !isFailed;
  const isDeposit = searchParams.get("type") === "deposit" || paymentInfo.txnRef.startsWith("DEP_");

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#f6f5f0] dark:bg-[#0b0f14] p-4 font-sans transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Status Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          {isSuccess && (
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle2 className="w-10 h-10" strokeWidth={2} />
            </div>
          )}
          {isFailed && (
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-500">
              <XCircle className="w-10 h-10" strokeWidth={2} />
            </div>
          )}
          {isProcessing && (
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-955/40 rounded-full flex items-center justify-center text-amber-500 animate-spin">
              <AlertCircle className="w-10 h-10" strokeWidth={2} />
            </div>
          )}

          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-4">
            {isSuccess 
              ? (isDeposit ? "Nạp tiền thành công! 🎉" : "Thanh toán thành công! 🎉") 
              : isFailed 
              ? (isDeposit ? "Nạp tiền thất bại" : "Thanh toán thất bại") 
              : (isDeposit ? "Đang xử lý nạp tiền... ⏳" : "Đang xử lý giao dịch... ⏳")}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs">
            {isSuccess
              ? (isDeposit 
                  ? "Cảm ơn bạn! Số tiền đã được nạp thành công vào tài khoản ví cá nhân của bạn qua cổng VNPAY." 
                  : "Cảm ơn bạn! Đơn hàng của bạn đã được ghi nhận thanh toán thành công qua cổng VNPAY.")
              : isFailed
              ? paymentInfo.message === "InvalidChecksum"
                ? "Chữ ký checksum giao dịch không hợp lệ. Vui lòng liên hệ bộ phận hỗ trợ."
                : (isDeposit 
                    ? `Nạp tiền không thành công. Mã lỗi: ${paymentInfo.responseCode || "Unknown"}`
                    : `Giao dịch không thành công. Mã lỗi: ${paymentInfo.responseCode || "Unknown"}`)
              : (isDeposit 
                  ? "Hệ thống đang đối soát kết quả nạp tiền từ VNPAY. Vui lòng đợi hoặc quay lại trang ví để kiểm tra số dư."
                  : "Hệ thống đang đối soát kết quả thanh toán từ VNPAY. Vui lòng đợi hoặc quay lại trang quản trị để xem trạng thái đơn hàng.")}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span>{isDeposit ? "Mã giao dịch" : "Mã đơn hàng"}</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              #{paymentInfo.txnRef || "N/A"}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-500">
            <span>Số tiền</span>
            <span className="font-bold text-red-500 text-sm">
              {formatCurrency(paymentInfo.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-500">
            <span>Phương thức</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">VNPAY Sandbox</span>
          </div>

          <div className="flex justify-between items-center text-slate-500">
            <span>Trạng thái</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                isSuccess
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : isFailed
                  ? "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400"
              }`}
            >
              {isSuccess ? "Thành công" : isFailed ? "Thất bại" : "Đang xử lý"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => navigate(isDeposit ? ROUTES.USER.ACCOUNT.WALLET : ROUTES.USER.ACCOUNT.DASHBOARD)}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            {isDeposit ? "Quay lại ví của tôi" : "Quay lại trang quản lý"} <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            to={ROUTES.USER.HOME}
            className="w-full py-3 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" /> Về trang chủ đấu giá
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentResult;
