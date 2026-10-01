import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import options from "./options";
import { useGetParams, renderDataTable } from "./utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const config = {
  id: "topicsFundingValues",
  idQuery: "thematicsFunding",
  title: {
    en: "Funding (M€)",
    fr: "Financements (M€)",
  },
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding",
};

export default function TopicsFundingValues() {
  const { params, currentLang } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return <ChartWrapper config={config} options={options(data)} renderData={() => renderDataTable(data, currentLang)} />;
}
