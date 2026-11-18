import i18n from "../i18n-global.json";

export type Level = "pillar" | "program" | "topic" | "destination";
export type Lang = "fr" | "en";

const labels = i18n as Record<string, { fr: string; en: string }>;

/**
 * Renvoie les fragments de texte qui dépendent du niveau de l'arborescence,
 * à utiliser comme placeholders dans les templates des graphiques :
 * - byLevel : "par programme"
 * - scope   : "pour chaque programme du pilier sélectionné"
 * - inLevel : "Dans le programme"
 */
export function getLevelLabels(level: Level, lang: Lang) {
  return {
    byLevel: labels[`level-${level}-by-level`]?.[lang] ?? "",
    scope: labels[`level-${level}-scope`]?.[lang] ?? "",
    inLevel: labels[`level-${level}-in-level`]?.[lang] ?? "",
  };
}
