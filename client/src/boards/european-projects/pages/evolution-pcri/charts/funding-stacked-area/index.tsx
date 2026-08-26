import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query.js";
import options from "./options.js";
import { useGetParams, readingKey, renderDataTable } from "./utils.js";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";

import { EPChartsSources } from "../../../../config.js";

import i18n from "./i18n.json";

export default function FundingStackedArea() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const params = useGetParams();
  const color = useChartColor();

  const { data, isLoading } = useQuery({
    queryKey: ["fundingByCountry", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const chartId = "fundingStackedArea";
  const config = {
    id: chartId,
    title: {
      fr: i18n.title.fr,
      en: i18n.title.en,
      className: "fr-pt-2w fr-pl-1w",
    },
    comment: {
      fr: <>{i18n.comment.fr}</>,
      en: <>{i18n.comment.en}</>,
    },
    readingKey: readingKey(data, isLoading),
    sources: EPChartsSources,
    integrationURL: `/integration?chart_id=${chartId}&${params}`,
  };

  return (
    <div className={`chart-container chart-container--${color}`}>
      <span className="chart-badge">Global</span>
      <ChartWrapper config={config} options={options(data, currentLang)} />
    </div>
  );
}
