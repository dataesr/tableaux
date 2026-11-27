import { useQuery } from "@tanstack/react-query";
import type React from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { formatToPercentLang } from "../../../../../../utils/format";
import { EPChartsSources } from "../../../../config.js";
import { getProportionChartTexts } from "../../proportion-charts-text";
import getOptions from "./options";
import { getData } from "./query";
import { findItem, getName, getOrderedCodes, getProportionKey, renderDataTable, useGetParams } from "./utils";

type ChartConfig = {
  id: string;
  title?: { fr: string; en: string };
  comment?: { fr: React.JSX.Element; en: React.JSX.Element };
  readingKey?: { fr: React.JSX.Element; en: React.JSX.Element };
  sources: typeof EPChartsSources;
  integrationURL: string;
};

export default function DestinationsFundingProportion({ displayType = "total_fund_eur" }: { displayType?: string }) {
  const { params, currentLang, countryN, adjMascPlural } = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: ["destinationsFundingProportion", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const items = data.data ?? [];

  // Reading key : premier élément dans l'ordre de l'API
  const firstCode = getOrderedCodes(items)[0];
  const evaluated = firstCode !== undefined ? findItem(items, firstCode, "evaluated") : undefined;
  const successful = firstCode !== undefined ? findItem(items, firstCode, "successful") : undefined;
  const valueKey = getProportionKey(displayType);

  const texts = getProportionChartTexts({
    displayType,
    level: "destination",
    countryN,
    adjMascPlural,
    name: { fr: getName(evaluated ?? successful, "fr"), en: getName(evaluated ?? successful, "en") },
    evaluated: formatToPercentLang(evaluated?.[valueKey] ?? 0, currentLang),
    successful: formatToPercentLang(successful?.[valueKey] ?? 0, currentLang),
  });

  const config: ChartConfig = {
    id: "destinationFundingProportion",
    title: texts.title,
    comment: texts.comment,
    readingKey: texts.readingKey,
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-proportion",
  };

  return <ChartWrapper config={config} options={getOptions(data, displayType, currentLang)} renderData={() => renderDataTable(data, currentLang)} />;
}
