import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import MapSkeleton from "../../../../../../components/charts-skeletons/map";
import { isAnEuropeanUnionCountry } from "../../../../../../utils/countries";
import { CreateChartOptions } from "../../../../components/chart-ep";
import { getMapOptions } from "./options";
import { CollaborationData, getEuropeanCollaborations } from "./query";
import { useGetParams } from "./utils";

export default function EuropeanMap() {
  const [searchParams] = useSearchParams();
  const params = useGetParams();

  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery<CollaborationData[]>({
    queryKey: ["getEuropeanCollaborations", params],
    queryFn: () => getEuropeanCollaborations(params),
  });

  const mapData =
    data
      ?.filter((item) => isAnEuropeanUnionCountry(item.country_code))
      .map((item) => ({
        "iso-a3": item.country_code,
        value: item.total_collaborations,
        name: currentLang === "fr" ? item.country_name_fr : item.country_name_en,
      })) || [];

  const config = {
    id: "european-map",
  };

  const mapOptions = getMapOptions(mapData, currentLang);

  const options = CreateChartOptions("map", mapOptions);

  if (isLoading) {
    return <MapSkeleton />;
  }

  return <ChartWrapper config={config} options={options} constructorType={"mapChart"} />;
}
