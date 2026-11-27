import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { EPChartsSources } from "../../../../config.js";
import getOptions from "./options";
import { getData } from "./query";
import { comment,  readingKey, renderDataTable, useGetParams } from "./utils";

export default function Top10Beneficiaries() {
  const [searchParams] = useSearchParams();
  const { params, currentLang } = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: ["top10beneficiaries", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;


  const chartId = "top10beneficiaries";
  const config = {
    id: chartId,
    idQuery: "top10beneficiaries",
    comment: comment(data),
    readingKey: readingKey(data, currentLang),
    sources: EPChartsSources,
    title: {
      fr: "Principaux pays bénéficiaires",
      en: "Top beneficiary countries",
    },
    integrationURL: `/integration?chart_id=${chartId}&${params}`,
  };

  const prepareData = (data) => {
    // Add selected country if it is not in the top 10
    const dataToReturn = data.top10.slice(0, 10);
    const selectedCountry = searchParams.get("country_code");
    if (selectedCountry) {
      const pos = data.top10.findIndex((item) => item.id === selectedCountry);
      if (pos >= 10 && pos !== -1) {
        dataToReturn.pop();
        const countryData = data.top10[pos];
        dataToReturn.push(countryData);
      }
    }
    return dataToReturn;
  };

  return (
    <div className="chart-container chart-container--default">
      <ChartWrapper
        config={config}
        options={getOptions(prepareData(data), searchParams.get("country_code") ?? null, currentLang)}
        renderData={() => renderDataTable(prepareData(data), currentLang, searchParams.get("country_code") ?? null)}
      />
    </div>
  );
}