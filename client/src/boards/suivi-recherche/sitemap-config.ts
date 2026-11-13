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
    { label: "Bibliométrie : profil", href: `${BASE}/bibliometrie` },
    { label: "Bibliométrie : établissements", href: `${BASE}/bibliometrie?section=etablissements` },
    { label: "Bibliométrie : international", href: `${BASE}/bibliometrie?section=international` },
    { label: "Financements et distinctions : profil", href: `${BASE}/financements` },
    { label: "Financements et distinctions : établissements", href: `${BASE}/financements?section=etablissements` },
    { label: "Financements et distinctions : international", href: `${BASE}/financements?section=international` },  ],
}
