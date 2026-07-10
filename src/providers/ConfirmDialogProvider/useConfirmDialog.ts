import { useContext } from "react";

import { ConfirmDialogContext } from "./ConfirmDialogContext";

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error(
      "useConfirmDialog must be used inside ConfirmDialogProvider",
    );
  }

  return context;
}
