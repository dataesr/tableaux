import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { Layout } from "../../../../layout/layout";
import { getI18nLabel } from "../../../../utils";
import { years } from "../../utils";
import i18n from "./i18n.json";

const BASE = "/valorisation-recherche-innovation";

export default function GlobalLayout() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("yearMax") || !searchParams.get("yearMin")) {
      if (!searchParams.get("yearMax")) {
        searchParams.set("yearMax", String(years[years.length - 1]));
      }
      if (!searchParams.get("yearMin")) {
        searchParams.set("yearMin", String(years[years.length - 6]));
      }
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  if (!pathname) return null;

  const items = [
    { key: "accueil", icon: "home-4-line", to: `${BASE}/accueil`, current: pathname === `${BASE}/accueil` },
    { key: "etablissement", to: `${BASE}/etablissement`, current: pathname.startsWith(`${BASE}/etablissement`) },
  ].map((item) => ({ ...item, label: getI18nLabel(i18n, item.key) }));

  return (
    <Layout
      footer={{ href: `${BASE}/accueil`, title: "Valorisation de la recherche - innovation - Tableaux" }}
      items={items}
      serviceHref={`${BASE}/accueil`}
      serviceName="Valorisation de la recherche - innovation"
      serviceTag=""
    />
  );
}
