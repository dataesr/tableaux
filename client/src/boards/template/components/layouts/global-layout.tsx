import { useLocation } from "react-router-dom";

import { Layout } from "../../../../layout/layout";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";

const BASE = "/template";

export default function GlobalLayout({ languageSelector = false }) {
  const { pathname, search } = useLocation();

  const items = [
    { key: "home", icon: "home-4-line", to: `${BASE}/home` },
    { key: "overview", to: `${BASE}/overview` },
  ].map(({ key, icon, to }) => ({
    current: pathname.startsWith(to),
    icon,
    key,
    label: getI18nLabel(i18n, key),
    to: `${to}${search}`,
  }));

  return (
    <Layout
      items={items}
      languageSelector={languageSelector}
      serviceHref={`${BASE}/home`}
      serviceName={getI18nLabel(i18n, "service")}
      serviceTag={getI18nLabel(i18n, "tagline")}
    />
  );
}
