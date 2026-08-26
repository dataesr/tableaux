import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/financements-par-aap";

export const FINANCEMENTS_PAR_AAP_SITEMAP: BoardSitemapConfig = {
  boardId: "financements-par-aap",
  boardName: "Financements par appel à projets",
  boardHomeHref: `${BASE}/accueil`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord des financements par appels à projets.",
  links: [
    { label: "Accueil", href: `${BASE}/accueil` },
    { label: "Comparaison", href: `${BASE}/comparaison` },
    { label: "Par région", href: `${BASE}/region` },
    { label: "Par établissement", href: `${BASE}/etablissement` },
  ],
};
