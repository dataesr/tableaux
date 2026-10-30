import { useLocation } from "react-router-dom";

import { Layout } from "../../../../layout/layout";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";

const BASE = "/personnel-enseignant";

export default function GlobalLayout() {
  const { pathname } = useLocation();

  if (!pathname) return null;

  const items = [
    { key: "home", label: getI18nLabel(i18n, "home"), icon: "home-4-line", to: `${BASE}/accueil` },
    { key: "etablissements", label: "Établissements", to: `${BASE}/etablissements` },
    { key: "disciplines", label: "Disciplines", to: `${BASE}/disciplines` },
    { key: "regions", label: "Régions", to: `${BASE}/regions` },
    { key: "academies", label: "Académies", to: `${BASE}/academies` },
    { key: "definitions", label: "Définitions", to: `${BASE}/definitions` },
  ].map((item) => ({ ...item, current: pathname === item.to }));

  return (
    <Layout
      footer={{ href: `${BASE}/accueil`, title: "#dataESR tableaux de bord" }}
      items={items}
      serviceHref="/"
      serviceTag="Tableau de bord du personnel enseignant des établissements d'enseignement supérieur français"
    />
  );
}
