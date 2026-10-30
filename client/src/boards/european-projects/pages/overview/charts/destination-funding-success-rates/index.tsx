import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import options from "./options";
import { getData } from "./query";
import { renderDataTable, useGetParams } from "./utils";

const config = {
  id: "destinationFundingSuccessRates",
  idQuery: "destinationFunding",
  title: {
    fr: "Taux de succès",
    en: "Success rate",
  },
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-success-rates",
};

export default function DestinationFundingSuccessRates() {
  const { params } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return <ChartWrapper config={config} options={options(data)} renderData={() => renderDataTable(data)} />;
}
