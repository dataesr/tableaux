import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    _paq: any[];
  }
}

const { VITE_APP_MATOMO_SITE_ID, VITE_APP_MATOMO_URL } = import.meta.env;

export function useMatomo() {
  const { pathname, search } = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!VITE_APP_MATOMO_URL || !VITE_APP_MATOMO_SITE_ID) return;

    if (!initialized.current) {
      initialized.current = true;
      window._paq = window._paq || [];
      window._paq.push(["setTrackerUrl", `${VITE_APP_MATOMO_URL}/matomo.php`]);
      window._paq.push(["setSiteId", VITE_APP_MATOMO_SITE_ID]);
      window._paq.push(["enableLinkTracking"]);
      const g = document.createElement("script");
      g.async = true;
      g.src = `${VITE_APP_MATOMO_URL}/matomo.js`;
      document.head.appendChild(g);
    }

    const url = pathname + search;
    window._paq.push(["setCustomUrl", url]);
    window._paq.push(["setDocumentTitle", document.title]);
    window._paq.push(["trackPageView"]);
  }, [pathname, search]);
}
