import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { RouterProvider } from "@tanstack/react-router";

import { router } from "./app/router";

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
            <RouterProvider router={router} />
          </ConfirmDialogProvider>
        </ToastProvider>
      </QueryProvider>
    </AppPreferencesProvider>
  </StrictMode>,
);
