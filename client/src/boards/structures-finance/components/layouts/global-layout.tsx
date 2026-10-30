import { useLocation, useSearchParams } from "react-router-dom";

import { Layout } from "../../../../layout/layout";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";

const BASE = "/structures-finance";
const FILTER_PARAMS = ["type", "typologie", "region", "rce", "devimmo"];

export default function GlobalLayout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const paramsWithoutFilters = new URLSearchParams(searchParams);
  FILTER_PARAMS.forEach((key) => paramsWithoutFilters.delete(key));
  const cleanParams = paramsWithoutFilters.toString();

  if (!pathname) return null;
  const is = (str: string): boolean => pathname.startsWith(str);

  const items = [
    { key: "home", label: getI18nLabel(i18n, "home"), icon: "home-4-line", to: `${BASE}/accueil`, current: pathname === `${BASE}/accueil` },
    {
      key: "etablissements",
      label: "Vue par établissement",
      to: `${BASE}/etablissements?${cleanParams}${cleanParams ? "&" : ""}onglet=ressources`,
      current: is(`${BASE}/etablissements`),
    },
    {
      key: "national",
      label: "Vue nationale",
      to: `${BASE}/national${cleanParams ? `?${cleanParams}` : ""}`,
      current: is(`${BASE}/national`),
    },
    { key: "definitions", label: "Définitions", to: `${BASE}/definitions`, current: is(`${BASE}/definitions`) },
  ];

  return (
    <Layout
      footer={{ href: `${BASE}/accueil`, title: "#dataESR tableaux de bord" }}
      items={items}
      serviceHref="/"
      serviceName="#dataESR tableaux de bord"
      serviceTag="Financement des établissements d'enseignement supérieur français"
    />
  );
}
