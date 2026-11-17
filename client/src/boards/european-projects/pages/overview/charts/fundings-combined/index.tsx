import { useQuery } from "@tanstack/react-query"
import React from "react"

import ChartWrapper from "../../../../../../components/chart-wrapper"
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default"
import { formatCurrencyLang, formatNumberLang, formatToRates } from "../../../../../../utils/format"
import { EPChartsSources } from "../../../../config"
import getOptions from "./options"
import { getData } from "./query"
import { useGetParams, renderDataTable } from "./utils"

const config: {
  id: string;
  idQuery: string;
  sources: typeof EPChartsSources
  integrationURL: string
  comment?: { fr: React.JSX.Element; en: React.JSX.Element }
  readingKey?: { fr: React.JSX.Element; en: React.JSX.Element }
  title?: { fr: string; en: string }
} = {
  id: "FundingCombined",
  idQuery: "FundingCombined",
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding",
};

export default function FundingCombined({ displayType = "total_fund_eur", groupBy }: { displayType: string; groupBy: "pillar" | "program" | "topic" | "destination" }) {
  const { params, currentLang, countryN, adjMascPlural } = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params, groupBy],
    queryFn: () => getData(params, groupBy),
  });

  if (isLoading || !data) return <DefaultSkeleton />
  const readingDataEvaluated = data.data.filter((d) => d.stage === "evaluated")[0]
  const readingDataSuccessful = data.data.filter((d) => d.stage === "successful" && d.code === readingDataEvaluated.code)[0]

  const total_coordination_number_rates = readingDataEvaluated?.total_coordination_number > 0 ? (readingDataSuccessful?.total_coordination_number ?? 0) / readingDataEvaluated?.total_coordination_number : 0
  const total_number_involved_rates = readingDataEvaluated?.total_number_involved > 0 ? (readingDataSuccessful.total_number_involved) / readingDataEvaluated.total_number_involved : 0
  const total_fund_eur_rates = readingDataEvaluated?.total_fund_eur > 0 ? (readingDataSuccessful.total_fund_eur) / readingDataEvaluated.total_fund_eur : 0
  const total_number_projects_rates = readingDataEvaluated?.total_projects > 0 ? (readingDataSuccessful.total_projects) / readingDataEvaluated.total_projects : 0

  switch (displayType) {
    case "total_coordination_number":
      config.title = { 
        fr: `Répartition par programme du nombre de projets évalués et lauréats coordonnés par ${countryN}`, 
        en: `Breakdown of the number of evaluated and successful projects coordinated by ${countryN}`
      }
      config.comment = {
        fr:
          <>
            Ce graphique présente, par programme du pilier sélectionné, la répartition du nombre de projets évalués et lauréats coordonnés par le pays sélectionné et les taux de succès associés (projets coordonnés lauréats sur projets coordonnés évalués).
          </>,
        en:
          <>
            This chart shows, for each programme of the selected pillar, the breakdown of the number of evaluated and successful projects coordinated by the selected country, together with the associated success rates (successful coordinated projects over evaluated coordinated projects).
          </>
      }
      config.readingKey = {
        fr:
          <>
            Dans le programme {readingDataEvaluated?.name_fr || ""}, {countryN} a été coordinatrice de <strong>{formatNumberLang(readingDataEvaluated.total_coordination_number, currentLang)}</strong> projets évalués{" "}
            et de <strong>{formatNumberLang(readingDataSuccessful?.total_coordination_number ?? 0, currentLang)}</strong> projets lauréats soit un taux de succès de <strong>{formatToRates(total_coordination_number_rates)}</strong>.
          </>,
        en:
          <>
            In the {readingDataEvaluated?.name_en || ""} programme, {countryN} coordinated <strong>{formatNumberLang(readingDataEvaluated.total_coordination_number, currentLang)}</strong> evaluated projects{" "}
            and <strong>{formatNumberLang(readingDataSuccessful?.total_coordination_number ?? 0, currentLang)}</strong> successful projects, a success rate of <strong>{formatToRates(total_coordination_number_rates)}</strong>.
          </>
      }
      break

    case "total_number_involved":
      config.title = { 
        fr: `Répartition par programme du nombre de candidats et participants ${adjMascPlural}`, 
        en: `Breakdown of the number of ${adjMascPlural} candidates and participants` 
      }
      config.comment = {
        fr: <>Ce graphique présente par programme du pilier sélectionné, la répartition du nombre de candidats et de participants du pays sélectionné et les taux de succès associés (le nombre de participants sur le nombre de candidats).</>,
        en: <>This chart shows, for each programme of the selected pillar, the breakdown, of the number of applicants and participants from the selected country, together with the associated success rates (number of participants over number of applicants).</>,
      }
      config.readingKey = {
        fr:
          <>
            Dans le programe {readingDataEvaluated?.name_fr || ""}, sur les {formatNumberLang(readingDataEvaluated.total_number_involved, currentLang)} candidats {adjMascPlural} évalués{" "}
            {formatNumberLang(readingDataSuccessful.total_number_involved, currentLang)} ont été lauréats, soit un taux de succès de {formatToRates(total_number_involved_rates)}.
          </>,
        en:
          <>
            In the {readingDataEvaluated?.name_en || ""} programme, of the {formatNumberLang(readingDataEvaluated.total_number_involved, currentLang)} {adjMascPlural} applicants evaluated,{" "}
            {formatNumberLang(readingDataSuccessful.total_number_involved, currentLang)} became participants in successful projects, a participant-level success rate of {formatToRates(total_number_involved_rates)}.
          </>
      }
      break

    case "total_projects":
      config.title = { 
        fr: `Répartition par programme du nombre de projets impliquant ${countryN}`, 
        en: `Breakdown by programme of the number of projects involving ${countryN}` 
      }
      config.comment = {
        fr: <>Ce graphique présente, par programme du pilier sélectionné, la répartition du nombre de projets évalués et lauréats du pays sélectionné et les taux de succès associés (le nombre de projets lauréats sur le nombre de projets évalués).</>,
        en: <>This chart shows, by programme of the selected pillar, the breakdown of the number of evaluated and successful projects involving the selected country, together with the associated success rates (the ratio of successful projects to evaluated projects).</>,
      }
      config.readingKey = {
        fr: 
          <>
            Dans le programme {readingDataEvaluated?.name_fr || ""}, {countryN} est présente dans {formatNumberLang(readingDataEvaluated.total_projects, currentLang)} projets évalués{" "}
            et {formatNumberLang(readingDataSuccessful.total_projects, currentLang)} projets lauréats, soit un taux de succès de {formatToRates(total_number_projects_rates)}.
          </>,
        en: 
          <>
            In the {readingDataEvaluated?.name_en || ""} programme, {countryN} is involved in {formatNumberLang(readingDataEvaluated.total_projects, currentLang)} evaluated projects{" "}
            and {formatNumberLang(readingDataSuccessful.total_projects, currentLang)} successful projects, a success rate of {formatToRates(total_number_projects_rates)}.
          </>,
      }
      break

    default: //"total_fund_eur"
      config.title = { 
        fr: `Répartition par programme des financements demandés et obtenus par ${countryN}`, 
        en: `Breakdown by programme of funding requested and secured by ${countryN}` 
      }
      config.comment = {
        fr: <>Ce graphique présente, par programme du pilier sélectionné, la répartition des financements demandés et obtenus par l'ensemble des participants du pays sélectionné et les taux de succès associés (le montant des financements obtenus sur le montant des financements demandés).</>,
        en: <>This chart shows, by programme of the selected pillar, the breakdown of funding requested and secured by all participants from the selected country, together with the associated success rates (the ratio of funding secured to funding requested)..</>,
      }
      config.readingKey = {
        fr:
          <>
            Dans le programme {readingDataEvaluated?.name_fr || ""}, {countryN} a demandé {formatCurrencyLang(readingDataEvaluated?.total_fund_eur || 0, currentLang)} et obtenu{" "}
            {formatCurrencyLang(readingDataSuccessful?.total_fund_eur || 0, currentLang)} soit un taux de succès de {formatToRates(total_fund_eur_rates)}.
          </>,
        en:
          <>
            In the {readingDataEvaluated?.name_en || ""} programme, {countryN} requested {formatCurrencyLang(readingDataEvaluated?.total_fund_eur || 0, currentLang)} and secured{" "}
            {formatCurrencyLang(readingDataSuccessful?.total_fund_eur || 0, currentLang)}, a funding success rate of {formatToRates(total_fund_eur_rates)}.
          </>
      }
      break
  }

    return (
    <>
         <ChartWrapper config={config} options={getOptions(data, displayType)} renderData={() => renderDataTable(data, currentLang)}/>
    </>
  )
}
