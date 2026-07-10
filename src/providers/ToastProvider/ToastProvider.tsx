import { useCallback, useState, type ReactNode } from "react";

import { motion, AnimatePresence } from "framer-motion";

import {
  ToastContext,
  type ToastMessage,
  type ToastType,
} from "./ToastContext";

interface Props {
  children: ReactNode;
}

export default function ToastProvider({ children }: Props) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now();

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ]);

      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        removeToast,
      }}
    >
      {children}

      <div
        className="
          fixed
          top-5
          right-5
          z-50
          space-y-3
        "
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}

              initial={{
                opacity: 0,
                x: 50,
              }}

              animate={{
                opacity: 1,
                x: 0,
              }}

              exit={{
                opacity: 0,
                x: 50,
              }}

              className={`
                alert shadow-lg
                ${
                  toast.type === "success"
                    ? "alert-success"
                    : toast.type === "error"
                      ? "alert-error"
                      : "alert-info"
                }
              `}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
