import { useLocation } from "react-router-dom";

import Breadcrumb from "../../../../components/breadcrumb";
import { useDashboardVisibility } from "../../../../hooks/useDashboardVisibility";
import { Layout } from "../../../../layout/layout";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";
import navigationConfig from "./navigation-config.json";

import "../../colors.scss";


const BASE = "/devenir-etudiants/entrants-en-L1-2019";

const NAV_ITEMS = [
  { key: "flux", labelKey: "flux", to: `${BASE}/flux` },
  { key: "repartition", labelKey: "repartition", to: `${BASE}/repartition` },
  { key: "plus-haut-diplome", labelKey: "plusHautDiplome", to: `${BASE}/plus-haut-diplome` },
  { key: "comparaison-profils", labelKey: "comparaisonProfils", to: `${BASE}/comparaison-profils` },
  { key: "methodologie", labelKey: "methodologie", to: `${BASE}/methodologie` },
] as const;

export default function GlobalLayout() {
  const { pathname, search } = useLocation();
  const isHomePageVisible = useDashboardVisibility("devenir-etudiants");

  if (!pathname) return null;

  const items = NAV_ITEMS.map(({ key, labelKey, to }) => ({
    current: pathname === to,
    key,
    label: getI18nLabel(i18n, labelKey),
    to: `${to}${search}`,
  }));

  return (
    <Layout
      before={
        <div className="fr-container fr-pt-2w fr-pb-0">
          {NAV_ITEMS.some(({ to }) => pathname === to) && (
            <Breadcrumb config={navigationConfig} homeHref={isHomePageVisible ? "/" : undefined} />
          )}
        </div>
      }
      footer={{
        href: `${BASE}/flux`,
        title: "Accueil - Parcours des néo-bacheliers inscrits en L1 en 2019 - Ministère de l'enseignement supérieur, de la recherche et de l'espace",
      }}
      items={items}
      serviceHref="/"
      serviceTag={getI18nLabel(i18n, "tagline")}
    />
  );
}
