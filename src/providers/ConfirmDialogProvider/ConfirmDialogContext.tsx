import { createContext } from "react";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const ConfirmDialogContext = createContext<
  ConfirmDialogContextType | undefined
>(undefined);
