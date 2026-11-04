import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import References from "./references";
import { getReferences } from "../../../api";
import { Title } from "@dataesr/dsfr-plus";
import Breadcrumb from "../../../components/breadcrumb";
import navigationConfig from "../navigation-config.json";

export default function OtherGeographicalLevels() {
  const [searchParams] = useSearchParams();

  const params = [...searchParams].map(([key, value]) => `${key}=${value}`).join("&");

  const { data: dataReferences, isLoading: isLoadingReferences } = useQuery({
    queryKey: ["atlas/get-references", params],
    queryFn: () => getReferences(params),
  });

  return (
    <>
      <Breadcrumb config={navigationConfig} />
      <section>
        <Title as="h2">Autres niveaux géographiques disponibles</Title>
        <References data={dataReferences?.data || []} isLoading={isLoadingReferences} />
      </section>
    </>
  );
}
