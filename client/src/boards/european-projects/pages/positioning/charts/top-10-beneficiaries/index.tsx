import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import { readingKey, useGetParams, renderDataTable } from "./utils";
import options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import { EPChartsSources } from "../../../../config.js";

export default function Top10Beneficiaries() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const params = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: ["top10beneficiaries", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const chartId = "top10beneficiaries";
  const config = {
    id: chartId,
    idQuery: "top10beneficiaries",
    comment: {
      fr: (
        <>
          Ce graphique représente le positionnement du pays sélectionné par rapport aux autres pays en fonction des subventions reçues. La courbe
          correspond au cumul des subventions allouées. Seuls les 10 premiers bénéficiaires sont affichés, le pays sélectionné étant ajouté en 10ème
          position s'il n'en fait pas partie.
        </>
      ),
      en: (
        <>
          This chart shows the positioning of the selected country compared to other countries based on the subsidies received. The curve corresponds
          to the cumulative subsidies allocated. Only the top 10 beneficiaries are displayed, with the selected country added in 10th position if it
          is not already included.
        </>
      ),
    },
    readingKey: readingKey(data),
    sources: EPChartsSources,
    title: {
      fr: "Classement des bénéficiaires",
      en: "Beneficiaries ranking",
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
      <ChartWrapper config={config} options={options(prepareData(data), searchParams.get("country_code") ?? null, currentLang)} renderData={() => renderDataTable(prepareData(data), currentLang, searchParams.get("country_code") ?? null)} />
    </div>
  );
}
