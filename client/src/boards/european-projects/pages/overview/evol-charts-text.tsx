import { getI18nLabel } from "../../../../utils";
import i18nCharts from "./i18n-charts.json";
import i18nEvol from "./i18n-evol-charts.json";

export type EvolLevel = "pillar" | "program" | "topic";
export type EvolChart = "values" | "rates";
type Lang = "fr" | "en";

const LANGS: Lang[] = ["fr", "en"];
const DISPLAY_TYPES = ["total_fund_eur", "total_coordination_number", "total_number_involved", "total_projects"];

// Clés des données selon le niveau d'arborescence
export const LEVELS: Record<EvolLevel, { itemsKey: string; codeKey: string; nameKey: string }> = {
  pillar: { itemsKey: "pillars", codeKey: "pilier_code", nameKey: "pilier_name" },
  program: { itemsKey: "programs", codeKey: "programme_code", nameKey: "programme_name" },
  topic: { itemsKey: "topics", codeKey: "thema_code", nameKey: "thema_name" },
};

// Légendes des séries (évalués / lauréats) selon le displayType
const LEGEND_KEYS: Record<string, [string, string]> = {
  total_fund_eur: ["requestedFunding", "securedFunding"],
  total_coordination_number: ["evaluatedCoordinations", "successfulCoordinations"],
  total_number_involved: ["applicantsNumber", "participantsNumber"],
  total_projects: ["evaluatedProjects", "successfulProjects"],
};

const getDisplayType = (displayType: string) => (DISPLAY_TYPES.includes(displayType) ? displayType : "total_fund_eur");

// Déduit le niveau (pilier, programme, thématique) de la structure des données renvoyées par l'API
// On teste du plus fin au plus large
export function getLevelFromData(data): EvolLevel {
  const stageData = data?.find((item) => item.country !== "all")?.data?.[0];
  const level = (["topic", "program", "pillar"] as EvolLevel[]).find((l) => Array.isArray(stageData?.[LEVELS[l].itemsKey]));
  return level || "pillar";
}

// Remplace les {placeholders} d'un libellé par leur valeur (laisse le placeholder si la valeur est absente)
export function fillPlaceholders(text: string, vars: Record<string, string | number | undefined>) {
  return (text || "").replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? String(vars[key]) : match));
}

// Transforme les **texte** du json en <strong>texte</strong>
export function renderBold(text: string) {
  return <>{text.split(/\*\*(.+?)\*\*/g).map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part))}</>;
}

// {selected} : "le pilier sélectionné" / {inLevel} : "dans le pilier XXX"
export function getLevelVars(level: EvolLevel, levelName: string, lang: Lang) {
  return {
    selected: getI18nLabel(i18nEvol, `levels.${level}.selected`, lang),
    inLevel: fillPlaceholders(getI18nLabel(i18nEvol, `levels.${level}.in`, lang), { name: levelName }),
  };
}

// Légendes serie_01 (évalués) / serie_02 (lauréats)
export function getEvolLegend(displayType: string, currentLang: string) {
  const [serie_01, serie_02] = LEGEND_KEYS[getDisplayType(displayType)];
  return {
    serie_01: getI18nLabel(i18nCharts, serie_01, currentLang),
    serie_02: getI18nLabel(i18nCharts, serie_02, currentLang),
  };
}

// Titre de l'axe Y : "total_fund_eur", "total_coordination_number", ... ou "share"
export function getEvolYAxisTitle(displayType: string, currentLang: string) {
  const key = displayType === "share" ? "share" : getDisplayType(displayType);
  return getI18nLabel(i18nEvol, `yAxis.${key}`, currentLang);
}

// Titre et commentaire d'un graphique
export function getEvolChartTexts({ chart, displayType, level, countryN, adjMascPlural }) {
  const type = getDisplayType(displayType);
  const title: any = {};
  const comment: any = {};

  LANGS.forEach((lang) => {
    const vars = { country: countryN, adjective: adjMascPlural, ...getLevelVars(level, "", lang) };
    title[lang] = fillPlaceholders(getI18nLabel(i18nEvol, `charts.${type}.${chart}.title`, lang), vars);
    comment[lang] = <>{fillPlaceholders(getI18nLabel(i18nEvol, `charts.${type}.${chart}.comment`, lang), vars)}</>;
  });

  return { title, comment } as { title: { fr: string; en: string }; comment: { fr: React.JSX.Element; en: React.JSX.Element } };
}

// Clé de lecture d'un graphique (evaluated, successful et rate sont déjà formatés)
export function getEvolReadingKey({ chart, displayType, level, levelName, countryN, adjMascPlural, year, evaluated, successful, rate = "" }) {
  const type = getDisplayType(displayType);
  const readingKey: any = {};

  LANGS.forEach((lang) => {
    const { inLevel } = getLevelVars(level, levelName?.[lang] || "unknown", lang);
    const text = fillPlaceholders(getI18nLabel(i18nEvol, `charts.${type}.${chart}.readingKey`, lang), {
      year,
      inLevel,
      country: countryN,
      adjective: adjMascPlural,
      evaluated,
      successful,
      rate,
    });
    readingKey[lang] = renderBold(text);
  });

  return readingKey as { fr: React.JSX.Element; en: React.JSX.Element };
}
