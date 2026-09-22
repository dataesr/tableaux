import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { EPChartsSources } from "../../../../config.js";

const config = {
  id: "FundingValuesPrograms",
  idQuery: "FundingValuesPrograms",
  comment: {
    fr: <>Comparaison des financements obtenus de chaque programme regroupé par pilier. Cette vision met en évidence les programmes ayant le plus d'impact dans chaque pilier.</>,
    en: <>A comparison of the funding secured by each programme, grouped by pillar. This overview highlights the programmes with the greatest impact within each pillar.</>,
  },
  sources: EPChartsSources,
  integrationURL: `/integration?chart_id=FundingValuesPrograms`,
};

export default function FundingValues() {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;
  return (
    <div className="fr-mt-3w chart-container chart-container--default">
      <ChartWrapper config={config} options={options(data, currentLang === "fr" ? "Financement obtenus (M€)" : "Funding (M€)", currentLang)} />
    </div>
  );
}
