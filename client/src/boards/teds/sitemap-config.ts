import type { BoardSitemapConfig } from "../board-sitemap-page";

const BASE = "/teds";

export const TEDS_SITEMAP: BoardSitemapConfig = {
  boardId: "teds",
  boardName: "TEDS",
  boardHomeHref: `${BASE}/home`,
  description: "Retrouvez l'ensemble des pages du tableau de bord TEDS.",
  links: [
    { label: "Accueil", href: `${BASE}/home` },
    { label: "Pays", href: `${BASE}/countries` },
    { label: "Entités", href: `${BASE}/entities` },
    { label: "Plan du site", href: "/plan-du-site?from=teds" },
  ],
};
