import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";
import { EPChartsSources } from "../../../../config";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { formatNumber, formatToRates, formatCurrency, formatCurrencyEn} from "../../../../../../utils/format";

const config: {
  id: string;
  idQuery: string;
  sources: typeof EPChartsSources;
  integrationURL: string;
  comment?: { fr: React.JSX.Element; en: React.JSX.Element };
  readingKey?: { fr: React.JSX.Element; en: React.JSX.Element };
} = {
  id: "FundingCombined",
  idQuery: "FundingCombined",
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding",
};

export default function FundingCombined({ displayType = "total_fund_eur", groupBy }: { displayType: string; groupBy: "pillar" | "program" | "topic" | "destination" }) {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params, groupBy],
    queryFn: () => getData(params, groupBy),
  });

  if (isLoading || !data) return <DefaultSkeleton />;
  const readingDataEvaluated = data.data.filter((d) => d.stage === "evaluated")[0];
  const readingDataSuccessful = data.data.find((d) => d.stage === "successful" && d.code === readingDataEvaluated.code);

  const total_coordination_number_rates = readingDataEvaluated?.total_coordination_number > 0 ? formatToRates(readingDataSuccessful.total_coordination_number / readingDataEvaluated.total_coordination_number) : 0;
  const total_number_involved_rates = readingDataEvaluated?.total_number_involved > 0 ? formatToRates(readingDataSuccessful.total_number_involved / readingDataEvaluated.total_number_involved) : 0;
  const total_fund_eur_rates = readingDataEvaluated?.total_fund_eur > 0 ? formatToRates(readingDataSuccessful.total_fund_eur / readingDataEvaluated.total_fund_eur) : 0;
  const total_number_projects_rates = readingDataEvaluated?.count > 0 ? formatToRates(readingDataSuccessful.count / readingDataEvaluated.count) : 0;

  switch (displayType) {
    case "total_coordination_number":
      config.comment = {
        fr: (
          <>
            Ce graphique présente la répartition, par pilier, des coordinations de projets évalués et lauréats par l'ensemble des participants du pays sélectionné et les taux de succès associé (coordinations projets lauréats / coordinations projets
            évalués).
          </>
        ),
        en: (
          <>
            This chart shows the breakdown, by pillar, of evaluated and successful project coordinations by all participants from the selected country, together with the associated success rates (successful project coordinations / evaluated project
            coordinations).
          </>
        ),
      };
      config.readingKey = {
        fr: (
          <>
            Dans le cadre des appels à projets concernant "{readingDataEvaluated?.name_fr || ""}", {formatNumber(readingDataEvaluated.total_coordination_number)} propositions ont été évaluées avec un participant du pays sélectionné comme coordinateur
            et {formatNumber(readingDataSuccessful.total_coordination_number)} d'entre elles sont lauréates, soit un taux de succès de {total_coordination_number_rates}.
          </>
        ),
        en: (
          <>
            Under "{readingDataEvaluated.name_en}" calls for proposals, {formatNumber(readingDataEvaluated.total_coordination_number)} proposals were evaluated with a participant from the selected country as coordinator, and{" "}
            {formatNumber(readingDataSuccessful.total_coordination_number)} of them were successful, a success rate of {total_coordination_number_rates}.
          </>
        ),
      };
      break;

    case "total_number_involved":
      config.comment = {
        fr: <>Ce graphique présente la répartition, par pilier, du nombre de candidats et de participants du pays sélectionné et les taux de succès associé (nombre de participants / nombre de candidats).</>,
        en: <>This chart shows the breakdown, by pillar, of the number of applicants and participants from the selected country, together with the associated success rates (number of participants / number of applicants).</>,
      };
      config.readingKey = {
        fr: (
          <>
            Dans le cadre des appels à projets concernant "{readingDataEvaluated?.name_fr || ""}", {formatNumber(readingDataEvaluated.total_number_involved)} candidats du pays sélectionné figuraient dans les propositions évaluées et{" "}
            {formatNumber(readingDataSuccessful.total_number_involved)} sont devenus participants d'un projet lauréat, soit un taux de succès de {total_number_involved_rates}.
          </>
        ),
        en: (
          <>
            Under "{readingDataEvaluated.name_en}" calls for proposals, {formatNumber(readingDataEvaluated.total_number_involved)} applicants were named in evaluated proposals and {formatNumber(readingDataSuccessful.total_number_involved)} of them
            became participants in successful projects, a success rate of {total_number_involved_rates}.
          </>
        ),
      };
      break;

    case "count":
      config.comment = {
        fr: <>Ce graphique présente la répartition, par pilier, du nombre de projets du pays sélectionné et les taux de succès associés (nombre de projets lauréats / nombre de projets évalués).</>,
        en: <>This chart shows the number of projects and success rates.</>,
      };
      config.readingKey = {
        fr: (
          <>
            Dans le cadre des appels à projets concernant "{readingDataEvaluated?.name_fr || ""}", {formatNumber(readingDataEvaluated.count)} candidats du pays sélectionné figuraient dans les propositions évaluées et{" "}
            {formatNumber(readingDataSuccessful.count)} sont devenus participants d'un projet lauréat, soit un taux de succès de {total_number_projects_rates}.
          </>
        ),
        en: (
          <>
            Under "{readingDataEvaluated.name_en}" calls for proposals, {formatNumber(readingDataEvaluated.count)} applicants were named in evaluated proposals and {formatNumber(readingDataSuccessful.count)} of them became participants in successful
            projects, a success rate of {total_number_projects_rates}.
          </>
        ),
      };
      break;

    default: //"total_fund_eur"
      config.comment = {
        fr: <>Ce graphique présente la répartition, par pilier, des financements demandés et obtenus par l'ensemble des participants du pays sélectionné et les taux de succès associé (montants obtenus / montants demandés).</>,
        en: <>This chart shows the breakdown, by pillar, of the funding requested and secured by all participants from the selected country, together with the associated success rates (funding secured / funding requested).</>,
      };
      config.readingKey = {
        fr: (
          <>
            Dans le cadre des appels à projets concernant "{readingDataEvaluated?.name_fr || ""}", les participants du pays sélectionné ont demandé {formatCurrency(readingDataEvaluated?.total_fund_eur || 0)} et obtenu{" "}
            {formatCurrency(readingDataSuccessful?.total_fund_eur || 0)} soit un taux de succès de {total_fund_eur_rates}.
          </>
        ),
        en: (
          <>
            Under "{readingDataEvaluated?.name_en}" calls for proposals, participants from the selected country requested {formatCurrencyEn(readingDataEvaluated?.total_fund_eur || 0)} and secured{" "}
            {formatCurrencyEn(readingDataSuccessful?.total_fund_eur || 0)}, a success rate of {total_fund_eur_rates}.
          </>
        ),
      };
      break;
  }

  const titles: Record<string, { fr: string; en: string }> = {
    total_fund_eur: { fr: "Répartition des financements et des taux de succès par pilier", en: "Breakdown of funding and success rates by pillar" },
    total_coordination_number: { fr: "Répartition des coordinations de projets évalués et lauréats par pilier", en: "Breakdown of evaluated and successful project coordinations by pilla" },
    total_number_involved: { fr: "Répartition du nombre de candidats et participants par pilier", en: "Breakdown of the number of candidates and participants by pillar" },
    count: { fr: "Répartition des projets par pilier", en: "Breakdown of projects by pillar" },
  };
  const title = (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"];

  return <ChartWrapper config={config} options={options(data, displayType, title)} />;
}
