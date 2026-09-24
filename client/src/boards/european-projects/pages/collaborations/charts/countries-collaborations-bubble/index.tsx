import { useQuery } from "@tanstack/react-query";

import { useGetParams } from "./utils";
import { getData } from "./query";
import options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useSearchParams } from "react-router-dom";

import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";

const i18n = { ...i18nGlobal, ...i18nLocal };

export default function CountriesCollaborationsBubble({ nbToShow = 5 }) {
  const [searchParams] = useSearchParams();
  const params = useGetParams();
  const currentLang = searchParams.get("language") || "fr";

  const chartId = "CountriesCollaborationsBubble";
  const configChart = {
    id: chartId,
    queryId: "CountriesCollaborations",
    title: {
      fr: `Top ${nbToShow} ${getI18nLabel(i18n, "countries-collaborated", currentLang)}`,
      en: `Top ${nbToShow} ${getI18nLabel(i18n, "countries-collaborated", currentLang)}`,
    },
    integrationURL: `/integration?chart_id=${chartId}&${params}`,
  };

  const { data, isLoading } = useQuery({
    queryKey: [configChart.id, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return <ChartWrapper config={configChart} options={options(data, currentLang, nbToShow)} />;
}
