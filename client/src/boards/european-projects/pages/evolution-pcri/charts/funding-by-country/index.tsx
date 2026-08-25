import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query.js";
import options from "./options.js";
import { useGetParams, readingKey, renderDataTable } from "./utils.js";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { getFlagEmoji } from "../../../../../../utils";
import allCountries from "../../../../../../components/country-selector/all-countries.json";
import Legend from "./legend";
import { EPChartsSources } from "../../../../config.js";

// Fonction pour convertir ISO3 vers ISO2
function getIso2(iso3) {
  return allCountries.find((country) => country.cca3 === iso3)?.cca2;
}

export default function FundingByCountry() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const countryCode = searchParams.get("country_code");
  const params = useGetParams();
  const color = useChartColor();

  const { data, isLoading } = useQuery({
    queryKey: ["fundingByCountry", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  // Récupérer le nom du pays depuis les données
  const countryName = data.length > 0 ? data[0].country_name_fr : "";
  const iso2Code = countryCode ? getIso2(countryCode) : "";
  const flagEmoji = iso2Code ? getFlagEmoji(iso2Code) : "";

  const chartId = "fundingByCountryEvolution";
  const config = {
    id: chartId,
    title: {
      fr: "Évolution des subventions de FP6 à Horizon Europe",
      en: "Funding evolution from FP6 to Horizon Europe",
      className: "fr-pt-2w fr-pl-1w",
    },
    comment: {
      fr: <>Evolution des subventions cumuleés obtenues par les pays depuis FP6 jusqu'à Horizon Europe.</>,
      en: <>Evolution of cumulative funding obtained by countries from FP6 to Horizon Europe.</>,
    },
    readingKey: readingKey(data, isLoading),
    sources: EPChartsSources,
    integrationURL: `/integration?chart_id=${chartId}&${params}`,
  };

  return (
    <div className={`chart-container chart-container--${color}`}>
      {countryCode && (
        <span className="chart-badge">
          {flagEmoji} {countryName}
        </span>
      )}
      <ChartWrapper config={config} options={options(data, currentLang)} renderData={() => renderDataTable(data, currentLang)} />
      <Legend />
    </div>
  );
}
