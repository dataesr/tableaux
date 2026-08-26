import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/personnel-enseignant";

export const FACULTY_MEMBERS_SITEMAP: BoardSitemapConfig = {
  boardId: "faculty-members-v2",
  boardName: "Personnel enseignant",
  boardHomeHref: `${BASE}/accueil`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord du personnel enseignant de l'enseignement supérieur français.",
  links: [
    { label: "Accueil", href: `${BASE}/accueil` },
    { label: "Établissements", href: `${BASE}/etablissements` },
    { label: "Disciplines", href: `${BASE}/disciplines` },
    { label: "Régions", href: `${BASE}/regions` },
    { label: "Académies", href: `${BASE}/academies` },
    { label: "Définitions", href: `${BASE}/definitions` },
  ],
};
