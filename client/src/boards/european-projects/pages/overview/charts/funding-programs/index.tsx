import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { EPChartsSources } from "../../../../config.js";
import options from "./options";
import { getData } from "./query";
import { useGetParams } from "./utils";

export default function FundingValues() {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const config = {
    id: "FundingValuesPrograms",
    idQuery: "FundingValuesPrograms",
    comment: {
      fr: <>Comparaison des financements obtenus de chaque programme regroupé par pilier. Cette vision met en évidence les programmes ayant le plus d'impact dans chaque pilier.</>,
      en: <>A comparison of the funding secured by each programme, grouped by pillar. This overview highlights the programmes with the greatest impact within each pillar.</>,
    },
    sources: EPChartsSources,
    integrationURL: `/integration?chart_id=FundingValuesPrograms`,
    title: currentLang === "fr" ? "Financements obtenus" : "Funding",
  };

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;
  return (
    <div className="fr-mt-3w chart-container chart-container--default">
      <ChartWrapper config={config} options={options(data, currentLang)} />
    </div>
  );
}
