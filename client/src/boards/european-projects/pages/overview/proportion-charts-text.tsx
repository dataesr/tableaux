import type React from "react";

import { getLevelLabels } from "../../utils/levelsGet";
import i18n from "./i18n-proportion-charts.json";

// Textes partagés des graphiques "part du pays" (funding-proportion), sur le modèle de evol-charts-text

type Lang = "fr" | "en";
export type ProportionLevel = "pillar" | "program" | "topic" | "destination";
type Texts = { fr: React.JSX.Element; en: React.JSX.Element };

// Remplace les {placeholders} par leur valeur (titres : texte brut)
function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

// Idem + transforme les **texte** en <strong>texte</strong> (comments et readingKeys)
function renderTemplate(tpl: string, vars: Record<string, string>): React.JSX.Element {
  const parts = fillTemplate(tpl, vars).split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}</>;
}

export function getProportionYAxisTitle(lang: Lang): string {
  return i18n.yAxis.share[lang];
}

export function getProportionChartTexts({
  displayType,
  level,
  countryN,
  adjMascPlural,
  name,
  evaluated,
  successful,
}: {
  displayType: string;
  level: ProportionLevel;
  countryN: string;
  adjMascPlural: string;
  // nom de l'élément utilisé dans la reading key
  name: { fr: string; en: string };
  // valeurs déjà formatées (ex : "12,5 %")
  evaluated: string;
  successful: string;
}): { title: { fr: string; en: string }; comment: Texts; readingKey: Texts } {
  const key = (displayType in i18n.charts ? displayType : "total_fund_eur") as keyof typeof i18n.charts;
  const texts = i18n.charts[key];

  const build = (lang: Lang) => {
    const vars = {
      ...getLevelLabels(level, lang),
      country: countryN,
      adjective: adjMascPlural,
      name: name[lang],
      evaluated,
      successful,
    };
    return {
      title: fillTemplate(texts.title[lang], vars),
      comment: renderTemplate(texts.comment[lang], vars),
      readingKey: renderTemplate(texts.readingKey[lang], vars),
    };
  };

  const fr = build("fr");
  const en = build("en");

  return {
    title: { fr: fr.title, en: en.title },
    comment: { fr: fr.comment, en: en.comment },
    readingKey: { fr: fr.readingKey, en: en.readingKey },
  };
}
