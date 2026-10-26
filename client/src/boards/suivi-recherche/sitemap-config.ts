import type { BoardSitemapConfig } from "../../pages/site-map/board-sitemap-page"

const BASE = "/suivi-recherche"

export const SITEMAP: BoardSitemapConfig = {
  boardId: "suivi-recherche",
  boardName: "Suivi de la recherche française",
  boardHomeHref: `${BASE}/accueil`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord « Suivi de la recherche française ».",
  links: [
    { label: "Accueil", href: `${BASE}/accueil` },
    { label: "Bibliométrie", href: `${BASE}/bibliometrie` },
  ],
}
