import { useLocation } from "react-router-dom";

import { Layout } from "../../../../layout/layout";
import { getI18nLabel, isInDevelopment } from "../../../../utils";
import { useSection as useBibliometrieSection } from "../../pages/bibliometrie/sections.ts";
import { useSection as useFinancementsSection } from "../../pages/financements/sections.ts";
import SelectionBar from "../selection";
import i18n from "./i18n.json";

const BASE = "/suivi-recherche";

const NAV_ITEMS = [
  { key: "accueil", icon: "home-4-line", to: `${BASE}/accueil` },
  { key: "bibliometrie", to: `${BASE}/bibliometrie` },
  { key: "fundings", to: `${BASE}/financements` },
  ...(isInDevelopment() ? [{ key: "innovation", to: `${BASE}/innovation` }] : []),
];

// Le header DSFR passe sa navigation dans une modale pilotée par le JS du DSFR, qui n'est pas chargé :
// la navigation vit donc dans une barre à part, ouverte sur mobile par un état React.
export default function GlobalLayout() {
  const { pathname, search } = useLocation();
  const bibliometrieSection = useBibliometrieSection();
  const financementsSection = useFinancementsSection();

  // Comparaison entre pays : le choix d'établissement ne s'applique pas
  const pays = (pathname === `${BASE}/bibliometrie` && bibliometrieSection.id === "international")
    || (pathname === `${BASE}/financements` && financementsSection.id === "international");


  const items = NAV_ITEMS.map(({ key, icon, to }) => {
    const params = new URLSearchParams(search);
    if (to === `${BASE}/innovation`) {
      params.delete("discipline");
      params.delete("domaine");
      params.delete("section");
    }
    const query = params.toString();
    return {
      current: pathname === to,
      icon,
      key,
      label: getI18nLabel(i18n, key),
      to: `${to}${query ? `?${query}` : ""}`,
    };
  });
  const innovation = pathname === `${BASE}/innovation`;

  return (
    <Layout
      before={pathname !== `${BASE}/accueil` && <SelectionBar innovation={innovation} pays={pays} />}
      footer={{ href: `${BASE}/accueil`, title: "Accueil - Suivi de la recherche française" }}
      items={items}
      exploreLink
      serviceHref={`${BASE}/accueil`}
      serviceName={getI18nLabel(i18n, "service")}
      serviceTag={getI18nLabel(i18n, "tagline")}
    />
  )
}
