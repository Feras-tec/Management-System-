import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import Application from "./Application";
import { QueryProvider, ConfirmDialogProvider } from "./providers";
import { AppPreferencesProvider } from "./context";
import ToastProvider from "./providers/ToastProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppPreferencesProvider>
      <QueryProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <Application />
          </ConfirmDialogProvider>
        </ToastProvider>
      </QueryProvider>
    </AppPreferencesProvider>
  </StrictMode>,
);
