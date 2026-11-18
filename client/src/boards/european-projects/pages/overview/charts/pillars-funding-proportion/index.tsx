import { useQuery } from "@tanstack/react-query";
import React from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { formatToPercentLang } from "../../../../../../utils/format";
import { EPChartsSources } from "../../../../config";
import options from "./options";
import { getData } from "./query";
import { getCode, getName, useGetParams } from "./utils";
import i18n from "./i18n.json";
import { getLevelLabels } from "../../../../utils/levelsGet";

type ChartConfig = {
  comment?: { fr: React.JSX.Element; en: React.JSX.Element };
  id: string;
  idQuery: string;
  integrationURL: string;
  readingKey?: { fr: React.JSX.Element; en: React.JSX.Element };
  sources: typeof EPChartsSources;
  title?: { en: string; fr: string; };
};

const baseConfig: ChartConfig = {
  id: "pillarsFundingProportion",
  idQuery: "pillarsFundingProportion",
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-proportion",
};

// Remplace les {placeholders} par leur valeur (pour les titres : texte brut)
function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

// Idem + transforme les **texte** en <strong>texte</strong> (pour comments et readingKeys)
function renderTemplate(tpl: string, vars: Record<string, string>): React.JSX.Element {
  const parts = fillTemplate(tpl, vars).split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}</>;
}

export default function PillarsFundingProportion({ displayType = "total_fund_eur" }: { displayType: string }) {
  const { params, currentLang, countryN, adjMascPlural } = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: [baseConfig.idQuery, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;
  const readingDataEvaluated = data.data.filter((d) => d.stage === "evaluated")[0];
  const readingDataSuccessful = readingDataEvaluated
    ? data.data.find((d) => d.stage === "successful" && getCode(d) === getCode(readingDataEvaluated))
    : undefined;

  // ChartWrapper / ChartFooter n'affichent que la langue de l'URL :
  // on ne calcule donc les textes que pour cette langue
  const lang = (currentLang === "en" ? "en" : "fr") as "fr" | "en";

  // Variables communes à tous les textes
  // Ce graphique n'affiche que le niveau pilier : les fragments de niveau ({scope}, {byLevel}, {inLevel}) sont fixés à "pillar"
  const vars = {
    ...getLevelLabels("pillar", lang),
    name: getName(readingDataEvaluated, lang),
    country: countryN,
    adjective: adjMascPlural,
  };

  // Config locale au composant (ne pas modifier un objet partagé entre les instances)
  const config: ChartConfig = { ...baseConfig };

  switch (displayType) {
    case "total_coordination_number": {
      const texts = i18n.total_coordination_number;
      const values = {
        evaluated: formatToPercentLang(readingDataEvaluated?.proportion_coordination_number ?? 0, currentLang),
        successful: formatToPercentLang(readingDataSuccessful?.proportion_coordination_number ?? 0, currentLang),
      };
      const title = fillTemplate(texts.title[lang], vars);
      const comment = renderTemplate(texts.comment[lang], vars);
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values });
      config.title = { fr: title, en: title };
      config.comment = { fr: comment, en: comment };
      config.readingKey = { fr: readingKey, en: readingKey };
      break;
    }

    case "total_number_involved": {
      const texts = i18n.total_number_involved;
      const values = {
        evaluated: formatToPercentLang(readingDataEvaluated?.proportion_number_involved ?? 0, currentLang),
        successful: formatToPercentLang(readingDataSuccessful?.proportion_number_involved ?? 0, currentLang),
      };
      const title = fillTemplate(texts.title[lang], vars);
      const comment = renderTemplate(texts.comment[lang], vars);
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values });
      config.title = { fr: title, en: title };
      config.comment = { fr: comment, en: comment };
      config.readingKey = { fr: readingKey, en: readingKey };
      break;
    }

    case "total_projects": {
      const texts = i18n.total_projects;
      const values = {
        evaluated: formatToPercentLang(readingDataEvaluated?.proportion_projects ?? 0, currentLang),
        successful: formatToPercentLang(readingDataSuccessful?.proportion_projects ?? 0, currentLang),
      };
      const title = fillTemplate(texts.title[lang], vars);
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values });
      const comment = renderTemplate(texts.comment[lang], vars);
      config.title = { fr: title, en: title };
      config.comment = { fr: comment, en: comment };
      config.readingKey = { fr: readingKey, en: readingKey };
      break;
    }

    default: { //"total_fund_eur"
      const texts = i18n.total_fund_eur;
      const values = {
        evaluated: formatToPercentLang(readingDataEvaluated?.proportion ?? 0, currentLang),
        successful: formatToPercentLang(readingDataSuccessful?.proportion ?? 0, currentLang),
      };
      const title = fillTemplate(texts.title[lang], vars);
      const comment = renderTemplate(texts.comment[lang], vars);
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values });
      config.title = { fr: title, en: title };
      config.comment = { fr: comment, en: comment };
      config.readingKey = { fr: readingKey, en: readingKey };
      break;
    }
  }

  return <ChartWrapper config={config} options={options(data, displayType, undefined, lang)} />;
}