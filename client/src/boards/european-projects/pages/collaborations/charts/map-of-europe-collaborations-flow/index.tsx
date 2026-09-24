import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { CreateChartOptions } from "../../../../components/chart-ep";
import { getCollaborations } from "../countries-collaborations-table/query";
import { useGetParams } from "../countries-collaborations-table/utils";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import MapSkeleton from "../../../../../../components/charts-skeletons/map";

import Options from "./options";

export default function MapOfEuropeCollaborationsFlow({ nbToShow }) {
  const [searchParams] = useSearchParams();
  const params = useGetParams();
  const countryCode = searchParams.get("country_code") || "FRA";

  const { data, isLoading } = useQuery({
    queryKey: ["CountriesCollaborationsTable", params],
    queryFn: () => getCollaborations(params),
  });

  const dataMap = isLoading || !data ? [] : data.map((item) => ({ from: countryCode, to: item.country_code, weight: item.total_collaborations }));

  const config = {
    id: "map-of-europe-collaborations-flow",
    title: {
      en: "Map of collaborations with countries",
      fr: "Carte des collaborations avec les pays",
    },
  };

  const options = CreateChartOptions("packedbubble", Options({ countryCode, dataMap, nbToShow }));

  if (isLoading) {
    return <MapSkeleton />;
  }

  return <ChartWrapper config={config} options={options} constructorType={"mapChart"} />;
}
