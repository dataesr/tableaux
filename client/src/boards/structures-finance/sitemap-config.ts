import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/structures-finance";

export const STRUCTURES_FINANCE_SITEMAP: BoardSitemapConfig = {
  boardId: "structures-finance",
  boardName: "Finance des établissements",
  boardHomeHref: `${BASE}/accueil`,
  description:
    "Retrouvez l'ensemble des pages du tableau de bord des finances des établissements d'enseignement supérieur français.",
  links: [
    { label: "Accueil", href: `${BASE}/accueil` },
    { label: "Vue nationale", href: `${BASE}/national` },
    { label: "Vue par établissement", href: `${BASE}/etablissements` },
    { label: "Définitions", href: `${BASE}/definitions` },
    { label: "Foire aux questions", href: `${BASE}/faq` },
    { label: "Plan du site", href: "/plan-du-site?from=structures-finance" },
  ],
};
