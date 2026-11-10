import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth/authContext";
import ScrollToTop from "./shared/components/ScrollToTop/ScrollToTop";
import { ToastProvider } from "./shared/components/Toast/ToastProvider";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import './index.css'
import App from "./App";
import "./theme.css";

document.addEventListener("touchstart", () => {}, { passive: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // reintenta una vez; evita esperar 3 reintentos antes de mostrar errores 4xx
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
