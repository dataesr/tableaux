import type { BoardSitemapConfig } from "./board-sitemap-page"

export const SITEMAP: BoardSitemapConfig = {
  boardId: "general",
  boardName: "Général",
  boardHomeHref: "/",
  description: "Retrouvez l'ensemble des pages générales",
  links: [
    { label: "Plan du site", href: "/plan-du-site" },
    { label: "Mentions légales", href: `/mentions-legales` },
    { label: "Données personnelles", href: "/donnees-personnelles" },
    { label: "Conditions générales d'utilisation", href: "/cgu" },
    { label: "Cookies", href: "/cookies" },
    { label: "Accessibilité", href: "/accessibility" },
    { label: "Contact", href: "/contact" },
  ],
}