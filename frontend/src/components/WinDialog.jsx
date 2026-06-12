import { useEffect, useRef } from "react";

const VARIANTS = {
  warning: {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 3L29 27H3L16 3Z" fill="#FCE100" stroke="#C4A000" strokeWidth="0.5" />
        <path d="M16 11V18" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="22.5" r="1.3" fill="#1A1A1A" />
      </svg>
    ),
  },
  success: {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#107C10" />
        <path d="M9 16.5L14 21.5L23 11" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#C42B1C" />
        <path d="M11 11L21 21M21 11L11 21" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#0067C0" />
        <path d="M16 14V22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="10" r="1.3" fill="white" />
      </svg>
    ),
  },
};

export default function WinDialog({
  open = false,
  title = "Thông báo",
  message = "",
  variant = "info",
  okText = "OK",
  cancelText = "Hủy",
  showCancel = false,
  onOk,
  onCancel,
  onClose,
}) {
  const okRef = useRef(null);
  const { icon } = VARIANTS[variant] ?? VARIANTS.info;

  useEffect(() => {
    if (open) okRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter" && !showCancel) onOk?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onOk, showCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0f14]/60 backdrop-blur-[2px] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="win-dialog-title"
        className="w-full max-w-[420px] overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 id="win-dialog-title" className="m-0 text-[12px] font-normal text-[#1a1a1a]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-[22px] w-[22px] items-center justify-center rounded-sm border-0 bg-transparent p-0 text-[#5c5c5c] transition hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex gap-3 px-4 pb-4 pt-1">
          <div className="shrink-0">{icon}</div>
          <p className="m-0 whitespace-pre-line text-[13px] leading-[1.45] text-[#1a1a1a]">
            {typeof message === 'object' ? JSON.stringify(message) : message}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#ebebeb] bg-[#f3f3f3] px-4 py-3">
          <button
            ref={okRef}
            type="button"
            onClick={onOk}
            className="min-w-[88px] rounded-[4px] border border-[#0067c0] bg-white px-5 py-[5px] text-[13px] text-[#1a1a1a] transition hover:bg-[#f0f6fc]"
          >
            {okText}
          </button>
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-w-[88px] rounded-[4px] border border-[#adadad] bg-white px-5 py-[5px] text-[13px] text-[#1a1a1a] transition hover:bg-[#f5f5f5]"
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
