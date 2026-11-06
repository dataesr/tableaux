import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import Options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { rangeOfYearsToApiFormat } from "../../url-utils";

interface CountryAdjectives {
  m: string;
  f: string;
}

interface ErcGenderByDestinationProps {
  countryAdj?: CountryAdjectives;
}

function useGetParams() {
  const [searchParams] = useSearchParams();
  const params: string[] = [];
  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);
  const rangeOfYears = searchParams.get("range_of_years");
  const callYear = rangeOfYearsToApiFormat(rangeOfYears);
  if (callYear) params.push(`call_year=${callYear}`);
  const currentLang = (searchParams.get("language") || "fr") as "fr" | "en";
  return { params: params.join("&"), currentLang };
}

export default function ErcGenderByDestination({ 
  countryAdj = { m: "français", f: "française" } }: 
  ErcGenderByDestinationProps
) {
  const { params: queryParams, currentLang } = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: ["ercGenderByDestination", queryParams],
    queryFn: () => getData(queryParams),
    enabled: !!queryParams,
  });

  const adjMascPlural = countryAdj.m.endsWith("s") ? countryAdj.m : `${countryAdj.m}s`; 

  const config = {
    id: "ercGenderByDestination",
    comment: {
      fr: (
        <>
          Répartition par genre des candidats ERC selon le type de financement. Les valeurs affichées sont des effectifs cumulés sur la période
          sélectionnée (non des moyennes). Les pourcentages sont calculés par type de financement sur les candidats dont le genre est identifié
          (femme, homme, non binaire).
        </>
      ),
      en: (
        <>
          Gender breakdown of ERC applicants by funding type. Figures shown are cumulative counts over the selected period (not averages). Percentages
          are calculated per funding type on applicants with an identified gender (female, male, non binary).
        </>
      ),
    },
    integrationURL: "/european-projects/components/pages/erc/charts/gender-by-destination",
  };

  const titleConfig = {
    fr: `Nombre de porteurs de projets ${adjMascPlural} par genre selon le type de financement ERC`,
    en: `Number of ${adjMascPlural} principal investigators by gender and ERC funding type`,
    className: "fr-mt-2w fr-ml-1w",
  };

  return (
    <div className="fr-my-5w chart-container--default">
      <ChartWrapper.Title config={{ title: titleConfig, id: config.id }} />
      {isLoading || !data ? (
        <DefaultSkeleton />
      ) : !data?.byDestination?.length ? (
        <p className="fr-text--sm fr-hint-text">{currentLang === "fr" ? "Aucune donnée disponible." : "No data available."}</p>
      ) : (
        <div className="chart-container chart-container--default">
          <ChartWrapper config={config} options={Options(data, currentLang)} renderData={() => null} />
        </div>
      )}
    </div>
  );
}
