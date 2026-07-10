import { useState, type ReactNode } from "react";

import {
  ConfirmDialogContext,
  type ConfirmOptions,
} from "./ConfirmDialogContext";

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export default function ConfirmDialogProvider({
  children,
}: ConfirmDialogProviderProps) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null,
  );

  const confirm = (confirmOptions: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(confirmOptions);

      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    resolver?.(true);

    setOptions(null);

    setResolver(null);
  };

  const handleCancel = () => {
    resolver?.(false);

    setOptions(null);

    setResolver(null);
  };

  return (
    <ConfirmDialogContext.Provider
      value={{
        confirm,
      }}
    >
      {children}

      {options && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{options.title}</h3>

            <p className="py-4">{options.message}</p>

            <div className="modal-action">
              <button className="btn" onClick={handleCancel}>
                {options.cancelText ?? "Cancel"}
              </button>

              <button className="btn btn-primary" onClick={handleConfirm}>
                {options.confirmText ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
