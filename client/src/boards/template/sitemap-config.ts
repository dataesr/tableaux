import type { BoardSitemapConfig } from "../../pages/site-map/board-sitemap-page";

export const SITEMAP: BoardSitemapConfig = {
  boardId: "template",
  boardName: "Template",
  boardHomeHref: "/template/home",
  description: "Pages du board template.",
  links: [
    { label: "Accueil", href: "/template/home" },
    { label: "Overview", href: "/template/overview" },
  ],
};
