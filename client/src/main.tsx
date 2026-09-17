import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DSFRConfig, ToastContextProvider } from "@dataesr/dsfr-plus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "remixicon/fonts/remixicon.css";

import AppRoutes from "./router.js";
import RouterLink from "./components/router-link.js";
import { ScrollToTop } from "./components/scroll-to-top.js";
import CookieConsent from "./components/cookies/cookie-consent/index.js";
import MatomoTracker from "./components/matomo-tracker/index.js";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <MatomoTracker />
        <ToastContextProvider>
          <DSFRConfig routerComponent={RouterLink}>
            <AppRoutes />
          </DSFRConfig>
        </ToastContextProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        <CookieConsent />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
