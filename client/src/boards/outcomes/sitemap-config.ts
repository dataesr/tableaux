import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/devenir-etudiants/entrants-en-L1-2019";

export const OUTCOMES_SITEMAP: BoardSitemapConfig = {
  boardId: "devenir-etudiants",
  boardName: "Le devenir des étudiants",
  boardHomeHref: `${BASE}/flux`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord « Parcours des néo-bacheliers inscrits en L1 en 2019 ».",
  links: [
    { label: "Flux", href: `${BASE}/flux` },
    { label: "Répartition", href: `${BASE}/repartition` },
    { label: "Plus haut diplôme", href: `${BASE}/plus-haut-diplome` },
    { label: "Comparaison de profils", href: `${BASE}/comparaison-profils` },
    { label: "Méthodologie", href: `${BASE}/methodologie` },
  ],
};
