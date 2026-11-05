import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { Layout } from "../../../../layout/layout";
import { getI18nLabel } from "../../../../utils";
import { years } from "../../utils";
import i18n from "./i18n.json";

const BASE = "/financements-par-aap";

export default function GlobalLayout() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("yearMax") || !searchParams.get("yearMin")) {
      if (!searchParams.get("yearMax")) {
        searchParams.set("yearMax", String(years[years.length - 2]));
      }
      if (!searchParams.get("yearMin")) {
        searchParams.set("yearMin", String(years[years.length - 2]));
      }
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const searchParamsFiltered = () => {
    if (!searchParams.has("section")) return searchParams;
    // Deep copy of searchParams
    const searchParamsCopy = new URLSearchParams(searchParams);
    searchParamsCopy.delete("section");
    return searchParamsCopy;
  }

  if (!pathname) return null;

  const items = [
    { key: "accueil", icon: "home-4-line", to: `${BASE}/accueil`, current: pathname === `${BASE}/accueil` },
    {
      key: "etablissement",
      to: `${BASE}/etablissement?${searchParamsFiltered()}`,
      current: pathname.startsWith(`${BASE}/etablissement`),
    },
    { key: "region", to: `${BASE}/region?${searchParamsFiltered()}`, current: pathname.startsWith(`${BASE}/region`) },
  ].map((item) => ({ ...item, label: getI18nLabel(i18n, item.key) }));

  return (
    <Layout
      footer={{ href: `${BASE}/accueil`, title: "Financements par appels à projets - Tableaux" }}
      items={items}
      serviceHref={`${BASE}/accueil`}
      serviceName="Financements par appels à projets"
      serviceTag="Suivi des financements par appels à projets dans les institutions françaises"
    />
  );
}
