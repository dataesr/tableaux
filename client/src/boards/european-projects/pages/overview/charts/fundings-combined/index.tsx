import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";
import { EPChartsSources } from "../../../../config";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { formatToRates } from "../../../../../../utils/format";

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
            Dans le cadre des appels à projets concernant "{readingDataEvaluated.name_fr}", {readingDataEvaluated.total_coordination_number} propositions ont été déposées avec un participant du pays sélectionné comme coordinateur et{" "}
            {readingDataSuccessful.total_coordination_number} d'entre elles ont été retenues, soit un taux de succès de {formatToRates(readingDataSuccessful.total_coordination_number / readingDataEvaluated.total_coordination_number)}.
          </>
        ),
        en: <>Under Pillar II calls for proposals, 3,600 proposals were submitted with a participant from the selected country as coordinator, and 740 of them were successful, a success rate of 20.6%.</>,
      };
      break;
    case "total_number_involved":
      config.comment = {
        fr: <>Ce graphique présente la répartition, par pilier, du nombre de candidats et de participants du pays sélectionné et les taux de succès associé (nombre de participants / nombre de candidats).</>,
        en: <>This chart shows the breakdown, by pillar, of the number of applicants and participants from the selected country, together with the associated success rates (number of participants / number of applicants).</>,
      };
      config.readingKey = {
        fr: <>Dans le cadre des appels à projets du pilier 2, 28 500 candidats figuraient dans les propositions déposées et 7 000 sont devenus participants à un projet lauréat, soit un taux de succès de 24,8 %.</>,
        en: <>Under Pillar II calls for proposals, 28,500 applicants were named in submitted proposals and 7,000 of them became participants in successful projects, a success rate of 24.8%.</>,
      };
      break;
    default: //"total_fund_eur"
      config.comment = {
        fr: <>Ce graphique présente la répartition, par pilier, des financements demandés et obtenus par l'ensemble des participants du pays sélectionné et les taux de succès associé (montants obtenus / montants demandés).</>,
        en: <>This chart shows the breakdown, by pillar, of the funding requested and secured by all participants from the selected country, together with the associated success rates (funding secured / funding requested).</>,
      };
      config.readingKey = {
        fr: <>Dans le cadre des appels à projets du pilier 2, les participants du pays sélectionné ont demandé 12 845M€ et obtenu 3 921M€ soit un taux de succès de 30,5%</>,
        en: <>Under Pillar II calls for proposals, participants from the selected country requested €12,845 million and secured €3,921 million, a success rate of 30.5%.</>,
      };
      break;
  }

  const titles: Record<string, { fr: string; en: string }> = {
    total_fund_eur: { fr: "Répartition des financements et des taux de succès par pilier", en: "Breakdown of funding and success rates by pillar" },
    total_coordination_number: { fr: "Répartition des coordinations de projets évalués et lauréats par pilier", en: "Breakdown of evaluated and successful project coordinations by pilla" },
    total_number_involved: { fr: "Répartition du nombre de candidats et participants par pilier", en: "Breakdown of the number of candidates and participants by pillar" },
  };
  const title = (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"];

  return <ChartWrapper config={config} options={options(data, displayType, title)} />;
}
