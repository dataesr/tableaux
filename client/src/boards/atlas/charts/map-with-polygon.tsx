import { useQuery } from "@tanstack/react-query";
import Map from "../../../components/map.tsx";

import { getGeoPolygon } from "../../../api/atlas.ts";

export default function MapWithPolygon({
  autoCenter = false,
  id = "",
  height = "400px",
  width = "100%",
  zoomControl = true,
}: {
  autoCenter?: boolean;
  id: string;
  height?: string;
  width?: string;
  zoomControl?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["atlas/get-geo-polygons", id],
    queryFn: () => getGeoPolygon(id),
  });

  if (isLoading || !data || !data.length) {
    return <div>Chargement ...</div>;
  }

  return (
    <section>
      <Map
        autoCenter={autoCenter}
        height={height}
        polygonCoordinates={data.map((el) => el.geometry)}
        width={width}
        zoomControl={zoomControl}
      />
    </section>
  );
}
