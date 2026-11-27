import i18nLevels from "./i18n-levels.json";

export type Level = "pillar" | "program" | "topic" | "destination";
export type Lang = "fr" | "en";

const label = (level: Level, key: string, lang: Lang): string => (i18nLevels as any)[level]?.[key]?.[lang] ?? "";

// Fragments de texte liés au niveau, lus dans i18n-levels.json
// {inLevel}  : "Dans le pilier"
// {byLevel}  : "par pilier"
// {scope}    : "pour chaque pilier"
// {selected} : "le pilier sélectionné" (ou "les topics sélectionnés" si count > 1)
export function getLevelLabels(level: Level, lang: Lang, count = 1) {
  const selectedKey = count > 1 && (i18nLevels as any)[level]?.selectedPlural ? "selectedPlural" : "selected";
  return {
    inLevel: label(level, "inLevel", lang),
    byLevel: label(level, "byLevel", lang),
    scope: label(level, "scope", lang),
    selected: label(level, selectedKey, lang),
  };
}