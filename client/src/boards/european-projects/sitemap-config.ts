import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/european-projects";

export const EUROPEAN_PROJECTS_SITEMAP: BoardSitemapConfig = {
  boardId: "european-projects",
  boardName: "Projets européens",
  boardHomeHref: `${BASE}/accueil`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord des projets européens.",
  links: [
    { label: "Accueil", href: `${BASE}/accueil` },
    { label: "Recherche", href: `${BASE}/search` },
    { label: "Horizon Europe", href: `${BASE}/horizon-europe` },
    { label: "Synthèse", href: `${BASE}/synthese` },
    { label: "Positionnement", href: `${BASE}/positionnement` },
    { label: "Collaborations", href: `${BASE}/collaborations` },
    { label: "Bénéficiaires", href: `${BASE}/beneficiaires` },
    { label: "Types de bénéficiaires", href: `${BASE}/beneficiaires-types` },
    { label: "MSCA", href: `${BASE}/msca` },
    { label: "ERC", href: `${BASE}/erc` },
    { label: "Évolution PCRI", href: `${BASE}/evolution-pcri` },
    { label: "Données de référence", href: `${BASE}/donnees-reference` },
    { label: "Informations", href: `${BASE}/informations` },
  ],
};
