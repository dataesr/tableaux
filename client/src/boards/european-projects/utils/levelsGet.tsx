import i18nLevels from "./i18n-levels.json";

// Fonctions partagées autour des niveaux (pilier, programme, thématique, destination)
// Utilisées par overview (graphs d'évolution, proportion) et positioning (top-10, intro…)

export type Level = "pillar" | "program" | "topic" | "destination";
export type Lang = "fr" | "en";
export type LevelName = { fr: string; en: string };

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

// Clés des données selon le niveau d'arborescence
export const LEVELS: Record<Level, { itemsKey: string; codeKey: string; nameKey: string }> = {
  pillar: { itemsKey: "pillars", codeKey: "pilier_code", nameKey: "pilier_name" },
  program: { itemsKey: "programs", codeKey: "programme_code", nameKey: "programme_name" },
  topic: { itemsKey: "items", codeKey: "code", nameKey: "name" },
  destination: { itemsKey: "items", codeKey: "code", nameKey: "name" },
};

// Remplace les {placeholders} d'un libellé par leur valeur (laisse le placeholder si la valeur est absente)
export function fillPlaceholders(text: string, vars: Record<string, string | number | undefined>) {
  return (text || "").replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? String(vars[key]) : match));
}

// Transforme les **texte** du json en <strong>texte</strong>
export function renderBold(text: string) {
  return <>{text.split(/\*\*(.+?)\*\*/g).map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))}</>;
}

const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);

// Textes liés aux niveaux, lus dans i18n-levels.json
// {selected} : "le pilier sélectionné" (ou "les thématiques sélectionnées" si count > 1)
// {inLevel}  : "dans le pilier XXX" (minuscule initiale : placé en milieu de phrase)
// {byLevel}  : "par pilier"
// {scope}    : "pour chaque pilier"
export function getLevelVars(level: Level, levelName: string, lang: Lang, count = 1) {
  const labels = getLevelLabels(level, lang, count);
  return {
    selected: labels.selected,
    inLevel: lowerFirst([labels.inLevel, levelName].filter(Boolean).join(" ")),
    byLevel: labels.byLevel,
    scope: labels.scope,
  };
}

const isValidName = (v) => typeof v === "string" && v.trim() !== "" && v.trim().toLowerCase() !== "unknown";

// Nom affiché d'un item : code pour les destinations, nom traduit sinon (autre langue puis code en secours)
export function getItemName(item, level: Level, lang: string) {
  const { codeKey, nameKey } = LEVELS[level];
  const code = item?.[codeKey] ?? "";
  if (level === "destination") return code;
  const l = lang === "en" ? "en" : "fr";
  const other = l === "en" ? "fr" : "en";
  return [item?.[`${nameKey}_${l}`], item?.[`${nameKey}_${other}`]].find(isValidName) ?? code;
}

// Niveau sélectionné renvoyé par l'API (champ "level" de la route top-10-beneficiaries) :
// { type: "pillar" | "program" | "topic" | "destination", items: [{ code, name_fr, name_en }] } ou null
export function getLevelFromResponse(data): { level: Level | null; name: LevelName | null; count: number } {
  const type = data?.level?.type;
  if (!type || !LEVELS[type]) return { level: null, name: null, count: 1 };

  const items = data.level.items ?? [];
  const first = items[0];
  const name = first
    ? {
        fr: [first.name_fr, first.name_en].find(isValidName) ?? first.code,
        en: [first.name_en, first.name_fr].find(isValidName) ?? first.code,
      }
    : null;

  return { level: type, name, count: Math.max(items.length, 1) };
}

const NO_LEVEL: Record<Lang, string> = { fr: "par Horizon Europe", en: "under Horizon Europe" };
const IN: Record<Lang, string> = { fr: "dans", en: "in" };

// Fragment à insérer en milieu de phrase :
// - aucun niveau ("tous les piliers") : "par Horizon Europe"
// - 1 élément                         : "dans le pilier Excellence science"
// - plusieurs éléments                : "dans les thématiques sélectionnées"
export function getLevelText({
  level,
  lang,
  name,
  count = 1,
}: {
  level: Level | null;
  lang: Lang;
  name: LevelName | null;
  count?: number;
}): string {
  if (!level) return NO_LEVEL[lang];
  const vars = getLevelVars(level, name?.[lang] ?? "", lang, count);
  if (count > 1) return `${IN[lang]} ${vars.selected}`;
  return vars.inLevel;
}