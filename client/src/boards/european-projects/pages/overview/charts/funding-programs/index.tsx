import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { formatToMillionsLang } from "../../../../../../utils/format";
import { EPChartsSources } from "../../../../config.js";
import options from "./options";
import { getData } from "./query";
import { useGetParams } from "./utils";
import i18nLocal from "./i18n.json";

export default function FundingValues() {
  const { params, currentLang, countryN } = useGetParams();
  const i18nChart = i18nLocal.charts.total_fund_eur;

  const { data, isLoading } = useQuery({
    queryKey: ["FundingValuesPrograms", params],
    queryFn: () => getData(params),
  });

  // Programme "successful" ayant le financement le plus élevé
  const topProgram = data?.data
    ?.filter((program) => program.stage === "successful")
    .sort((a, b) => (b.total_fund_eur ?? 0) - (a.total_fund_eur ?? 0))[0];

  const getReadingKey = (lang) =>
    i18nChart.readingKey[lang]
      .replace("{country}", countryN)
      .replace("{name}", topProgram?.[`name_${lang}`] ?? "")
      .replace("{successful}", formatToMillionsLang(topProgram?.total_fund_eur ?? 0, lang));

  const config = {
    id: "FundingValuesPrograms",
    idQuery: "FundingValuesPrograms",
    comment: {
      fr: <>{i18nChart.comment.fr}</>,
      en: <>{i18nChart.comment.en}</>,
    },
    readingKey: {
      fr: <>{getReadingKey("fr")}</>,
      en: <>{getReadingKey("en")}</>,
    },
    sources: EPChartsSources,
    integrationURL: `/integration?chart_id=FundingValuesPrograms`,
    title: getI18nLabel(i18nChart, "title", currentLang).replace("{country}", countryN),
  };

  if (isLoading || !data) return <DefaultSkeleton />;
  return (
    <div className="fr-mt-3w chart-container chart-container--default">
      <ChartWrapper config={config} options={options(data, currentLang, getI18nLabel(i18nLocal.yAxis, "total_fund_eur", currentLang))} />
    </div>
  );
}