import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/valorisation-recherche-innovation";

export const VALORISATION_RECHERCHE_INNOVATION_SITEMAP: BoardSitemapConfig = {
  boardId: "valorisation-recherche-innovation",
  boardName: "Valorisation, recherche et innovation",
  boardHomeHref: `${BASE}/accueil`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord de la valorisation, recherche et innovation.",
  links: [
    { label: "Accueil", href: `${BASE}/accueil` },
    { label: "Par établissement", href: `${BASE}/etablissement` },
  ],
};
