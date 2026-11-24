import { useQuery } from "@tanstack/react-query"
import React from "react"

import ChartWrapper from "../../../../../../components/chart-wrapper"
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default"
import { formatCurrencyLang, formatNumberLang, formatToPercentLang } from "../../../../../../utils/format"
import { EPChartsSources } from "../../../../config"
import { getLevelLabels } from "../../../../utils/levelsGet"
import { Level, sortByLevel } from "../../../../utils/levelsSort"
import i18n from "./i18n.json"
import getOptions from "./options"
import { getData } from "./query"
import { renderDataTable, useGetParams } from "./utils"

type ChartConfig = {
  id: string;
  idQuery: string;
  sources: typeof EPChartsSources
  integrationURL: string
  comment?: { fr: React.JSX.Element; en: React.JSX.Element }
  readingKey?: { fr: React.JSX.Element; en: React.JSX.Element }
  title?: { fr: string; en: string }
}

const baseConfig: ChartConfig = {
  id: "FundingCombined",
  idQuery: "FundingCombined",
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding",
};

// Remplace les {placeholders} par leur valeur (pour les titres : texte brut)
function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "")
}

// Idem + transforme les **texte** en <strong>texte</strong> (pour comments et readingKeys)
function renderTemplate(tpl: string, vars: Record<string, string>): React.JSX.Element {
  const parts = fillTemplate(tpl, vars).split(/\*\*(.+?)\*\*/g)
  return <>{parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}</>
}

export default function FundingCombined({ displayType = "total_fund_eur", groupBy }: { displayType: string; groupBy: Level }) {
  const { adjMascPlural, countryN, currentLang, params } = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: [baseConfig.idQuery, params, groupBy],
    queryFn: () => getData(params, groupBy),
  });
  if (isLoading || !data) return <DefaultSkeleton />

  const items = sortByLevel(data.data, groupBy)
  const readingDataEvaluated = items.filter((d) => d.stage === "evaluated")[0]
  const readingDataSuccessful = items.filter((d) => d.stage === "successful" && d.code === readingDataEvaluated?.code)[0]

  const total_coordination_number_rates = readingDataEvaluated?.total_coordination_number > 0 ? (readingDataSuccessful?.total_coordination_number ?? 0) / readingDataEvaluated.total_coordination_number : 0
  const total_number_involved_rates = readingDataEvaluated?.total_number_involved > 0 ? (readingDataSuccessful?.total_number_involved ?? 0) / readingDataEvaluated.total_number_involved : 0
  const total_fund_eur_rates = readingDataEvaluated?.total_fund_eur > 0 ? (readingDataSuccessful?.total_fund_eur ?? 0) / readingDataEvaluated.total_fund_eur : 0
  const total_number_projects_rates = readingDataEvaluated?.total_projects > 0 ? (readingDataSuccessful?.total_projects ?? 0) / readingDataEvaluated.total_projects : 0

  // ChartWrapper / ChartFooter n'affichent que la langue de l'URL :
  // on ne calcule donc les textes que pour cette langue
  const lang = (currentLang === "en" ? "en" : "fr") as "fr" | "en"

  // Variables communes à tous les textes (fragments du niveau : pilier, programme, topic, destination)
  const vars = {
    ...getLevelLabels(groupBy, lang),
    country: countryN,
    adjective: adjMascPlural,
    name: (lang === "fr" ? readingDataEvaluated?.name_fr : readingDataEvaluated?.name_en) || "",
  }

  // Config locale au composant (ne pas modifier un objet partagé entre les instances)
  const config: ChartConfig = { ...baseConfig }

  switch (displayType) {
    case "total_coordination_number": {
      const texts = i18n.total_coordination_number
      const values = {
        evaluated: formatNumberLang(readingDataEvaluated?.total_coordination_number ?? 0, currentLang),
        successful: formatNumberLang(readingDataSuccessful?.total_coordination_number ?? 0, currentLang),
        rate: formatToPercentLang(total_coordination_number_rates*100, currentLang),
      }
      const title = fillTemplate(texts.title[lang], vars)
      const comment = renderTemplate(texts.comment[lang], vars)
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values })
      config.title = { fr: title, en: title }
      config.comment = { fr: comment, en: comment }
      config.readingKey = { fr: readingKey, en: readingKey }
      break
    }

    case "total_number_involved": {
      const texts = i18n.total_number_involved
      const values = {
        evaluated: formatNumberLang(readingDataEvaluated?.total_number_involved ?? 0, currentLang),
        successful: formatNumberLang(readingDataSuccessful?.total_number_involved ?? 0, currentLang),
        rate: formatToPercentLang(total_number_involved_rates*100, currentLang),
      }
      const title = fillTemplate(texts.title[lang], vars)
      const comment = renderTemplate(texts.comment[lang], vars)
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values })
      config.title = { fr: title, en: title }
      config.comment = { fr: comment, en: comment }
      config.readingKey = { fr: readingKey, en: readingKey }
      break
    }

    case "total_projects": {
      const texts = i18n.total_projects
      const values = {
        evaluated: formatNumberLang(readingDataEvaluated?.total_projects ?? 0, currentLang),
        successful: formatNumberLang(readingDataSuccessful?.total_projects ?? 0, currentLang),
        rate: formatToPercentLang(total_number_projects_rates*100, currentLang),
      }
      const title = fillTemplate(texts.title[lang], vars)
      const comment = renderTemplate(texts.comment[lang], vars)
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values })
      config.title = { fr: title, en: title }
      config.comment = { fr: comment, en: comment }
      config.readingKey = { fr: readingKey, en: readingKey }
      break
    }

    default: { //"total_fund_eur"
      const texts = i18n.total_fund_eur
      const values = {
        requested: formatCurrencyLang(readingDataEvaluated?.total_fund_eur ?? 0, currentLang),
        secured: formatCurrencyLang(readingDataSuccessful?.total_fund_eur ?? 0, currentLang),
        rate: formatToPercentLang(total_fund_eur_rates*100, currentLang),
      }
      const title = fillTemplate(texts.title[lang], vars)
      const comment = renderTemplate(texts.comment[lang], vars)
      const readingKey = renderTemplate(texts.readingKey[lang], { ...vars, ...values })
      config.title = { fr: title, en: title }
      config.comment = { fr: comment, en: comment }
      config.readingKey = { fr: readingKey, en: readingKey }
      break
    }
  }

  return (
    <>
      <ChartWrapper config={config} options={getOptions(data, displayType, currentLang, undefined, groupBy)} renderData={() => renderDataTable(data, currentLang, groupBy)} />
    </>
  )
}