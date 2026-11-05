import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import CountrySelector from "../../../../components/country-selector/selector";
import { Layout } from "../../../../layout/layout";
import i18n from "./i18n.json";

import "../styles.scss";
import "../../colors.scss";
import { getI18nLabel } from "../../../../utils";

const BASE = "/european-projects";

export default function GlobalLayout() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const filtersParams = searchParams.toString();

  useEffect(() => {
    if (!searchParams.get("language")) {
      searchParams.set("language", "fr"); // default value
      setSearchParams(searchParams);
    }
    if (!searchParams.get("country_code")) {
      searchParams.set("country_code", "FRA"); // default value
      setSearchParams(searchParams);
    }
    if (!searchParams.get("range_of_years")) {
      searchParams.set("range_of_years", "2021|2022|2023|2024|2025"); // default value
      setSearchParams(searchParams);
    }
    if (!searchParams.get("isEjo")) {
      searchParams.set("isEjo", "false"); // default value
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  if (!pathname) return null;
  const is = (str: string): boolean => pathname.startsWith(str);
  const label = (key: string) => i18n[key][currentLang];

  const items = [
    { key: "home", icon: "home-4-line", label: label("home"), to: `${BASE}/accueil`, current: pathname === `${BASE}/accueil` },
    { key: "he", label: label("he"), to: `${BASE}/horizon-europe?section=synthesis&${filtersParams}`, current: is(`${BASE}/horizon-europe`) },
    { key: "msca", label: "Focus MSCA", to: `${BASE}/msca?${filtersParams}`, current: is(`${BASE}/msca`) },
    { key: "erc", label: "Focus ERC", to: `${BASE}/erc?${filtersParams}`, current: is(`${BASE}/erc`) },
    { key: "evolutionPcri", label: label("evolutionPcri"), to: `${BASE}/evolution-pcri`, current: is(`${BASE}/evolution-pcri`) },
    { key: "entities", label: label("entities"), to: `${BASE}/entities?${filtersParams}`, current: is(`${BASE}/entities`) },
    { key: "methodology", label: label("methodology"), to: `${BASE}/methodology?${filtersParams}`, current: is(`${BASE}/methodology`) },
  ];

  return (
    <div className="ep-styles">
      <Layout items={items} languageSelector navExtra={<CountrySelector />} serviceHref={`${BASE}/accueil`} serviceTag={getI18nLabel(i18n, "tagline")} />
    </div>
  );
}
