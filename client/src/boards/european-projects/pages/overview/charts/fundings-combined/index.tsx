import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";
import { EPChartsSources } from "../../../../config";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const config: {
  id: string;
  idQuery: string;
  sources: typeof EPChartsSources;
  integrationURL: string;
  comment?: { fr: JSX.Element; en: JSX.Element };
  readingKey?: { fr: JSX.Element; en: JSX.Element };
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

  switch (displayType) {
    case "total_coordination_number":
      config.comment = {
        fr: <>total_coordination_number</>,
        en: <>total_coordination_number EN</>,
      };
      config.readingKey = {
        fr: <>{data.data[0][displayType]}</>,
        en: <>Under Pillar II calls for proposals, participants from the selected country requested €12,845 million and secured €3,921 million, a success rate of 30.5%.</>,
      };
      break;
    case "total_number_involved":
      config.comment = {
        fr: <>total_number_involved</>,
        en: <>total_number_involved EN</>,
      };
      config.readingKey = {
        fr: <>{data.data[0][displayType]}</>,
        en: <>Under Pillar II calls for proposals, participants from the selected country requested €12,845 million and secured €3,921 million, a success rate of 30.5%.</>,
      };
      break;
    default: //"total_fund_eur"
      config.comment = {
        fr: <>Ce graphique présente la répartition, par pilier, des financements demandés et obtenus par l'ensemble des participants du pays sélectionné et les taux de succès associé (montants obtenus / montants demandés).</>,
        en: <>This chart shows the breakdown, by pillar, of the funding requested and secured by all participants from the selected country, together with the associated success rates (funding secured ÷ funding requested).</>,
      };
      config.readingKey = {
        fr: <>{data.data[0][displayType]}</>,
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
