import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import options from "./options";
import { useGetParams, renderDataTable } from "./utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const config = {
  id: "destinationFundingProportion",
  title: {
    fr: "Part des financement demandés et obtenus par le pays sur l'ensemble des pays",
    en: "Funding requested and obtained by the country on all countries",
  },
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-proportion",
};

export default function DestinationFundingProportion({ displayType = "total_fund_eur" }: { displayType?: string }) {
  const { params } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: [config.id, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return <ChartWrapper config={config} options={options(data, displayType)} renderData={() => renderDataTable(data)} />;
}
