import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";
import { EPChartsSources } from "../../../../config";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const config = {
  id: "FundingCombined",
  idQuery: "FundingCombined",
  comment: {
    fr: <>Ce graphique présente la répartition, par pilier, des financements demandés et obtenus par l'ensemble des participants du pays sélectionné et les taux de succès associé (montants obtenus / montants demandés).</>,
    en: <>This chart shows the breakdown, by pillar, of the funding requested and secured by all participants from the selected country, together with the associated success rates (funding secured ÷ funding requested).</>,
  },
  readingKey: {
    fr: <>Dans le cadre des appels à projets du pilier 2, les participants du pays sélectionné ont demandé 12 845M€ et obtenu 3 921M€ soit un taux de succès de 30,5%</>,
    en: <>Under Pillar II calls for proposals, participants from the selected country requested €12,845 million and secured €3,921 million, a success rate of 30.5%.</>,
  },
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

  const titles: Record<string, { fr: string; en: string }> = {
    total_fund_eur: { fr: "Répartition des financements et des taux de succès par pilier", en: "Breakdown of funding and success rates by pillar" },
    total_coordination_number: { fr: "Répartition des coordinations de projets évalués & lauréats par pilier", en: "Breakdown of evaluated & successful project coordinations by pilla" },
    total_number_involved: { fr: "Répartition du nombre de candidats & participants par pilier", en: "Breakdown of the number of candidates & participants by pillar" },
  };
  const title = (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"];

  return <ChartWrapper config={config} options={options(data, displayType, title)} />;
}
