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
    fr: <>Ce graphique affiche la répartition des financements demandés et obtenus (en M€) par pilier, ainsi que le taux de succès associé (montants obtenus / montants demandés).</>,
    en: <>This chart displays the distribution of requested and obtained funding (in M€) by pillar, as well as the associated success rate (amounts obtained / amounts requested).</>,
  },
  readingKey: {
    fr: <>Pour le pilier "Excellence Scientifique", les projets ont demandé 5 835 M€ de subventions, et en ont obtenu 1 154.3 M€, soit un taux de succès de 19.8 %.</>,
    en: <>For the "Scientific Excellence" pillar, projects requested 5,835 M€ in funding and obtained 1,154.3 M€, representing a success rate of 19.8%.</>,
  },
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding",
};

export default function FundingCombined({ displayType = "total_fund_eur" }: { displayType: string }) {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const titles: Record<string, { fr: string; en: string }> = {
    total_fund_eur: { fr: "Total des financements", en: "Total funding" },
    total_coordination_number: { fr: "Total des coordinations", en: "Total coordinations" },
    total_number_involved: { fr: "Total des participations", en: "Total participations" },
  };
  const title = (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"];

  return <ChartWrapper config={config} options={options(data, displayType, title)} />;
}
