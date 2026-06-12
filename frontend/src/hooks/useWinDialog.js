import { useCallback, useState } from "react";

export function useWinDialog() {
  const [dialog, setDialog] = useState(null);

  const closeDialog = useCallback(() => setDialog(null), []);

  const showAlert = useCallback(({ title = "Thông báo", message, variant = "info" }) => {
    setDialog({ title, message, variant, mode: "alert" });
  }, []);

  const showConfirm = useCallback(
    ({ title = "Xác nhận", message, variant = "warning", okText = "OK", cancelText = "Hủy" }) =>
      new Promise((resolve) => {
        setDialog({
          title,
          message,
          variant,
          mode: "confirm",
          okText,
          cancelText,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
    []
  );

  return { dialog, closeDialog, showAlert, showConfirm };
}
