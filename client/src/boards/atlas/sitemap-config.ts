import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/atlas";

export const ATLAS_SITEMAP: BoardSitemapConfig = {
  boardId: "atlas",
  boardName: "Atlas des effectifs étudiants",
  boardHomeHref: `${BASE}/general`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord de l'atlas des effectifs étudiants.",
  links: [
    { label: "Vue générale", href: `${BASE}/general` },
    { label: "Effectifs par filière", href: `${BASE}/effectifs-par-filiere` },
    { label: "Effectifs par secteur", href: `${BASE}/effectifs-par-secteur` },
    { label: "Effectifs par genre", href: `${BASE}/effectifs-par-genre` },
    {
      label: "Autres niveaux géographiques",
      href: `${BASE}/autres-niveaux-geographiques`,
    },
    { label: "Méthodologie", href: `${BASE}/methodologie` },
  ],
};
