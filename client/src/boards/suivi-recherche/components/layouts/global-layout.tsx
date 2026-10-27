import { useLocation } from "react-router-dom";

import { Layout } from "../../../../layout/layout";
import { getI18nLabel } from "../../../../utils";
import SelectionBar from "../selection";
import i18n from "./i18n.json";

const BASE = "/suivi-recherche";

export default function GlobalLayout() {
  const { pathname, search } = useLocation();

  const items = [
    { key: "accueil", icon: "home-4-line", to: `${BASE}/accueil` },
    { key: "bibliometrie", to: `${BASE}/bibliometrie` },
  ].map(({ key, icon, to }) => ({
    current: pathname === to,
    icon,
    key,
    label: getI18nLabel(i18n, key),
    to: `${to}${search}`,
  }));

  return (
    <Layout
      before={pathname !== `${BASE}/accueil` && <SelectionBar />}
      footer={{ href: `${BASE}/accueil`, title: "Accueil - Suivi de la recherche française" }}
      items={items}
      serviceHref={`${BASE}/accueil`}
      serviceTag={getI18nLabel(i18n, "tagline")}
    />
  );
}
