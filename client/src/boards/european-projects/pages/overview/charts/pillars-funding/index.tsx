import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams, renderDataTable } from "./utils";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const config = {
  id: "pillarsFundingValues",
  idQuery: "pillarsFunding",
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding",
};

export default function PillarsFundingValues() {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
  });
  
  if (isLoading || !data) return <DefaultSkeleton />;

  return (
    <>
      <ChartWrapper config={config} options={options(data, currentLang === "fr" ? "Subventions (M€)" : "Funding (M€)")} renderData={() => renderDataTable(data, "fr")} />
    </>
  );
}
