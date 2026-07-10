import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;

  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);
